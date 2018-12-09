let restaurant;
var newMap;

const newId = () => Date.now()

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiYW5zaHUxOSIsImEiOiJjampwd2Y4aDkwYTR4M3JwNDJnOG03OWd5In0.7EShJ7h0tqFCJ2mr5ARQeA',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerText = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerText = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerText = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchOfflineReview()
    .then(data => {
      const reviews = [...restaurant.review, ...data];
      fillReviewsHTML(reviews);
    })
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerText = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerText = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerText = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerText = 'No reviews yet!';
    container.appendChild(noReviews);
    addReviewButton(container);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
  addReviewButton(container);
}

addReviewForm = (container) => {
  
  // const form = document.createElement('form');
  // form.setAttribute('class', 'add-review-form')
  // form.setAttribute('method', 'post');
  // form.setAttribute('action', 'http://localhost:1337/reviews/');
  // form.innerHTML = `
  //   <label>
  //     Name: <input type="text" name="name" value="" />
  //   </label>
  //   <label>
  //     Rating (1 to 5): <input type="number" name="rating" min="1" max="5" />
  //   </label>
  //   <label>
  //     Comment:
  //     <textarea name="comments"></textarea>
  //   </label>
  // `;
  // const reviewButton = document.createElement('button');
  // reviewButton.textContent = 'Add Review';
  // reviewButton.className = 'add-review-button';
  // form.appendChild(reviewButton);
  // container.appendChild(form);
  // addSubmitListener(form);
}

addReviewButton = (container) => {
  
  addReviewForm(container);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const div = document.createElement('div');
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerText = review.name;
  name.classList.add("name");
  div.appendChild(name);

  const date = document.createElement('p');
  date.innerText = new Date(Number.parseInt(review.updatedAt, 10)).toDateString();
  date.classList.add("review_date");
  div.appendChild(date);

  li.appendChild(div);
  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.classList.add("rating");
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList.add("comment");
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

(() => {
  document.querySelector('.add-review-form').addEventListener('submit', (evt) => {
    evt.preventDefault();
    const ul = document.getElementById('reviews-list');
    const review = "";
    const formData = new FormData(document.querySelector('.add-review-form'));
    formData.append('restaurant_id', getParameterByName('id'));
    // ul.appendChild(createReviewHTML(review));
    
    const stringifiedFormData = DBHelper.stringifyFormData(formData);

    fetch('http://localhost:1337/reviews/', {
      method: 'POST',
      body: stringifiedFormData,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        ul.appendChild(createReviewHTML(data))
      })
      .catch((err) => {
        const data = JSON.parse(stringifiedFormData);
        data["updatedAt"] = new Date().getTime();
        data["createdAt"] = new Date().getTime();
        data['id'] = newId();
        console.log(data);
        DBHelper.saveReview(data); // Save in case of offline
        ul.appendChild(createReviewHTML(data))
        console.log(err);
      });
  });
})();

// addSubmitListener = (form) => {
//   form.addEventListener('submit', (event) => {
//     event.preventDefault();
//     const formData = new FormData(document.querySelector('.add-review-form'));
//     console.log(Array.from(formData.values()));
//   });
// }