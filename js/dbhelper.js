/**
 * Common database helper functions.
 */

const DB_NAME = 'restaurants';
const REVIEW_DB_NAME = 'reviews';
const OBJ_STORE_NAME = 'restaurant-information';

const makeOrOpenIDB = async (objStoreName) => {
  return idb.open(DB_NAME, 1, upgradeDB => {
    upgradeDB.createObjectStore(objStoreName, {keyPath: 'id'});
  });
}

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static async fetchRestaurants(callback) {

    const db = await makeOrOpenIDB(OBJ_STORE_NAME);
    var tx = db.transaction(OBJ_STORE_NAME);
    var store = tx.objectStore(OBJ_STORE_NAME);
    const data = await store.getAll();
    
    if (data.length > 0) {
      console.log('get all working');
      console.dir(data);
      return callback(null, data);
    }
    

    try {
      const response = await fetch(DBHelper.DATABASE_URL, {credentials:'same-origin'});
      const restaurantsJson = await response.json();

      const reviewPromises = restaurantsJson.map(async restaurant => {
        const id = restaurant.id;
        const review = await fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`, {credentials:'same-origin'});
        const reviewJson = await review.json();
        return {
          ...restaurant,
          review: reviewJson,
        };
      });

      const restaurantsWithReviews = await Promise.all(reviewPromises);

      const tx = db.transaction(OBJ_STORE_NAME , 'readwrite');
      const store = tx.objectStore(OBJ_STORE_NAME);
      console.log(restaurantsWithReviews);
      restaurantsWithReviews.map(restaurant => store.put(restaurant));

      return callback(null, restaurantsWithReviews);
    } catch(err) {
      return callback(err, null)
    }

    // let xhr = new XMLHttpRequest();
    // xhr.open('GET', DBHelper.DATABASE_URL);
    // xhr.onload = () => {
    //   if (xhr.status === 200) { // Got a success response from server!
    //     const json = JSON.parse(xhr.responseText);
    //     const restaurants = json.restaurants;
    //     callback(null, restaurants);
    //   } else { // Oops!. Got an error from server.
    //     const error = (`Request failed. Returned status of ${xhr.status}`);
    //     callback(error, null);
    //   }
    // };
    // xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  static fetchRestaurantReview(id) {

  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */
  static openReviewIDB() {
    return idb.open(REVIEW_DB_NAME, 1, upgradeDB => {
      upgradeDB.createObjectStore(OBJ_STORE_NAME, {keyPath: 'id'});
    });
  }

  static stringifyFormData(formData) {
    const object = {};
    formData.forEach(function(value, key){
        object[key] = value;
    });
    const json = JSON.stringify(object);
    return json;
  }

  static putReviewInCacheDB(review) {
    
  }

  static async fetchOfflineReview() {
    const db = await DBHelper.openReviewIDB();
    const tx = db.transaction(OBJ_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJ_STORE_NAME);
    const data = await store.getAll();
    if (data.length > 0) {
      return data;
    }
    return [];
  }

  static async saveReview(review) {
    const db = await DBHelper.openReviewIDB();
    var tx = db.transaction(OBJ_STORE_NAME, 'readwrite');
    var store = tx.objectStore(OBJ_STORE_NAME);
    console.log(review);
    store.put(review);
  }
}

const deleteReviewsByID = async (key) => {
  const db = await DBHelper.openReviewIDB();
  const tx = db.transaction(OBJ_STORE_NAME, 'readwrite');
  const store = tx.objectStore(OBJ_STORE_NAME);
  store.delete(key);
  return tx.complete
}

window.addEventListener('online', async (evt) => {
  console.log('online event running ');
  const reviews = await DBHelper.fetchOfflineReview();
  if (reviews.length > 0) {
    for (const review of reviews) {
      const id = review['id'];
      review['id'] = undefined;
      const res = await fetch('http://localhost:1337/reviews/', {
        method: 'POST',
        body: JSON.stringify(review),
      });
      const data = await res.json();

      await deleteReviewsByID(id);
    }
  }

});