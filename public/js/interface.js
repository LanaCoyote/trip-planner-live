function Day( hotel, restaurants, activities ) {
  this.hotel = hotel || undefined;
  this.restaurants = restaurants || [];
  this.activities = activities || [];
  this.markers = [];
}

var days = [new Day()];
var current_day_idx = 0;

function isToday( day_idx ) {
  return day_idx === current_day_idx;
}

function addDay() {
    days.push(new Day());

    var btnHtml = '<button class="btn btn-circle day-btn">' + days.length + '</button>';
    var btnItem = $(btnHtml);
    $('#add-day-btn').before(btnItem);
}

function removeToday() {
    if (days.length === 0) return;

    if (days.length === 1) {
        days[0] = new Day();
        clearListGroups();
        return;
    }

    var $day_btns = $( '.day-btn' );
    $day_btns[$day_btns.length - 2].remove();

    clearMarkersForToday();
    days.splice(current_day_idx, 1);
    if (current_day_idx >= days.length)
        current_day_idx = days.length - 1;
    changeDay(current_day_idx)
}

function clearMarkersForToday() {
    days[current_day_idx].markers.forEach(function(marker) {
        marker.setMap(null);
    });
}

function changeDay(new_day_idx) {
    current_day_idx = new_day_idx;
    var today = days[current_day_idx];

    $( '#day-title span' ).text('Day ' + (current_day_idx + 1));

    clearListGroups();

    days[current_day_idx].markers.forEach(function(marker) {
        marker.setMap(map);
    });

    $( '.day-buttons' ).children().each(function(){
        $(this).removeClass('current-day');
    })

    $($( '.day-buttons' ).children()[current_day_idx]).addClass('current-day');

    if ( today.hotel )
        addItemToListGroup(today.hotel, hotel_list_group);

    today.restaurants.forEach(function(restaurant) {
        addItemToListGroup(restaurant, restaurants_list_group);
    })

    today.activities.forEach(function(activity) {
        addItemToListGroup(activity, activities_list_group);
    })

    generateBounds();
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
    if( days[day_idx].hotel ) days[day_idx].hotel.marker.setMap( null );
    days[day_idx].hotel = item;
    if( hotel_list_group.html().length > 0 ) hotel_list_group.html( '' );
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
  if (item.marker) item.marker.setMap(null);
  item.marker = drawLocation(item.place[0].location);
  days[day_idx].markers.push(item.marker);

  generateBounds();
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
  item.marker.setMap(null);
  days[day_idx].markers.splice( days[day_idx].markers.indexOf( item.marker ), 1 );

  generateBounds();
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

$( "#add-activities-panel" ).on( 'click', 'button', function( event ) {
  var $btn = $( this );

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

$( '.day-buttons' ).on( 'click', 'button', function( event ){
    var $btn = $(this);
    if ($btn.attr( 'id' ) === 'add-day-btn' ) {
        addDay();
    } else {
        var new_day_idx = Number($btn.text()) - 1;
        clearMarkersForToday();
        changeDay(new_day_idx);
    }
})

$( '#day-title' ).on( 'click', 'button', removeToday);
