Giants = new Meteor.Collection("giants");

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
  
  /*menu switcher*/
  
  Template.mainMenu.events({
    'click .mainMenuItem' : function() {
      Session.set("activeTab", this);
    },
  });
  
  Template.myApp.activeGiants = function() {
    if(!(Session.get("activeTab")) || (Session.get("activeTab") == "Giants"))
      return true;
  };
  
  Template.myApp.activeFeed = function() {
    if(Session.get("activeTab") == "Feed")
      return true;
  };
   
  Template.myApp.activeMe = function() {
    if(Session.get("activeTab") == "Me")
      return true;
  };
  
  /*end of menu switcher*/
  
  Template.giants.noGiants = function() {
    if(Giants.find({added_by: Meteor.userId()}).count() === 0)
      return true;
  };
  
  Template.addGiant.events = ({
    'click #addGiantLink' : function() {
      $(".addGiantForm").toggle();
    },
    'click #addGiantButton' : function() {
      if($("#newGiantName").val() == "") {
        alert("please enter name!");
      } else {
        Giants.insert({added_by: Meteor.userId(), name: $("#newGiantName").val()});
      }
    }
  });
  
  Template.allGiants.giants = function() {
    return Giants.find({added_by: Meteor.userId()});
  };
  
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
