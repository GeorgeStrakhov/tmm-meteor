if (Meteor.isClient) {
  
  Template.app.userLogged = function() {
    if (Meteor.user() || Meteor.userLoaded()) {
      return true;
    } else {
      return false;
    }
  };
  
  Template.mainMenu.items = function() {
    var menuItems = [
      "Giants",
      "Feed",
      "Me",
    ];
    return menuItems;
  };
  
  Template.mainMenu.events({
    'click .mainMenuItem' : function() {
      Session.set("activeTab", this);
    },
  });
  
  Template.myApp.activeGiants = function() {
    if(!(Session.get("activeTab")) || (Session.get("activeTab") == "Giants")) {
      return true;
    } else {
      return false;
    }
  };
  
  Template.myApp.activeFeed = function() {
    if(Session.get("activeTab") == "Feed") {
      return true;
    } else {
      return false;
    }
  };
   
  Template.myApp.activeMe = function() {
    if(Session.get("activeTab") == "Me") {
      return true;
    } else {
      return false;
    }
  };
  
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
