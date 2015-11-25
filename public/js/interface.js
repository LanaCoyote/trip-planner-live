function Day( hotel, restaurants, activities ) {
  this.hotel = hotel || [];
  this.restaurants = restaurants || [];
  this.activities = activities || [];
}

var days = [new Day()];
var current_day_idx = 0;

function isToday( day_idx ) {
  return day_idx === current_day_idx;
}

function getType( item ) {
  if ( item.amenities ) { // hotel
    item.type = "hotel";
  } else if ( item.cuisines ) { // restaurant
    item.type = "restaurant";
  } else if ( item.age_range ) { // activity
    item.type = "activity";
  } else {
    throw new TypeError( "Item of unknown type" );
  }

  return item.type;
}

function typeMatcher( item, hotel_cb, restaurant_cb, activity_cb ) {
  var type = getType( item );
  var match = { hotel:hotel_cb, restaurant:restaurant_cb, activity:activity_cb };

  return match[type]( item, type );
}

function addItemToDay( item, day_idx ) {
  var ifHotel = function( item ) {
    days[day_idx].hotel = item;
    if( isToday( day_idx ) ) addItemToListGroup( item, hotel_list_group );
  }

  var ifRestaurant = function( item ) {
    days[day_idx].restaurants.push( item );
    if( isToday( day_idx ) ) addItemToListGroup( item, restaurants_list_group );
  } 

  var ifActivity = function( item ) {
    days[day_idx].activities.push( item );
    if( isToday( day_idx ) ) addItemToListGroup( item, activities_list_group );
  } 

  typeMatcher( item, ifHotel, ifRestaurant, ifActivity );
}

function removeItemFromDay( item, day_idx ) {
  var ifHotel = function( item ) {
    if( days[day_idx].hotel._id === item._id ) {
      delete days[day_idx].hotel;
    }
  } 

  var otherwise = function( item, type ) {
    var type_prop = type === 'restaurant' ? 'restaurants' : 'activities';
    var item_idx = days[day_idx][type_prop].indexOf( item );
    days[day_idx][type_prop].splice( item_idx, 1 );
  }

  typeMatcher( item, ifHotel, otherwise, otherwise );
}

function getItemByName( name, type ) {
  if ( type === 'hotel' ) {
    return all_hotels.find( function( hotel ) {
      return hotel.name === name;
    } );
  } else if ( type === 'restaurant' ) {
    return all_restaurants.find( function( restaurant ) {
      return restaurant.name === name;
    } );
  } else if ( type === 'activity' ) {
    return all_activities.find( function( activity ) {
      return activity.name === name;
    } );
  }
}

var hotel_list_group = $( "#hotel-list-group" );
var restaurants_list_group = $( "#restaurants-list-group" );
var activities_list_group = $( "#activities-list-group" );
var list_groups = [hotel_list_group, restaurants_list_group, activities_list_group];

function clearListGroups() {
  list_groups.forEach( function( lg ) {
    lg.html( '' );
  } );
}

function addItemToListGroup( item, list_group ) {
  // create itinerary item
  var it_html = "<div class=\"iteinerary-item\">\n" +
    "<span class=\"title\">" + item.name + "</span>\n" +
    "<button class=\"btn btn-xs btn-danger remove btn-circle\">x</button>" +
    "</div>";
  var it_item = $( it_html );

  it_item.children( 'button' ).on( 'click', function( event ) {
    removeItemFromDay( item, current_day_idx );
    it_item.remove();
  } );

  // add it to the list group
  list_group.append( it_item );
}

//function removeParentFromListGroup() {
  //$( this ).parent().remove();
//}



$( "#add-activities-panel" ).on( 'click', 'button', function( event ) {
  var $btn = $( this );
  console.log( $btn.attr( "id" ) );

  if ( $btn.attr( "id" ) === "add-hotel-btn" ) {
    var name = $btn.prev().find(":selected").text();
    var item = getItemByName( name, 'hotel' );
    addItemToDay( item, current_day_idx );
  } else if ( $btn.attr( "id" ) == "add-restaurant-btn" ) {
    var name = $btn.prev().find(":selected").text();
    var item = getItemByName( name, 'restaurant' );
    addItemToDay( item, current_day_idx );
  } else if ( $btn.attr( "id" ) == "add-activity-btn" ) {
    var name = $btn.prev().find(":selected").text();
    var item = getItemByName( name, 'activity' );
    addItemToDay( item, current_day_idx );
  }
} );
