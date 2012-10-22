Giants = new Meteor.Collection("giants");

/*CLIENT*/

if (Meteor.isClient) {
  
  Template.app.userLogged = function() {
    if (Meteor.user() && Meteor.userLoaded()) {  
      return true;
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
  
  /*top menu switcher*/
  
  Template.mainMenu.events({
    'click .mainMenuItem' : function() {
      Session.set("activeTab", this);
      if (this == "Giants")
        Session.set("currentGiant", false);
    },
  });
  
  Template.myApp.activeGiants = function() {
    if(!(Session.get("activeTab")) || (Session.equals("activeTab", "Giants")))
      return true;
  };
  
  Template.myApp.activeFeed = function() {
    if(Session.equals("activeTab", "Feed"))
      return true;
  };
   
  Template.myApp.activeMe = function() {
    if(Session.equals("activeTab", "Me"))
      return true;
  };
  
  /*end of top menu switcher*/
  
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
  
  Template.allGiants.events = ({
    'click .singleGiantLink' : function() {
      Session.set("currentGiant", this.name);
    }
  });
  
  Template.giants.currentGiant = function() {
    return Session.get("currentGiant")
  };
  
  Template.singleGiantPage.giant = function() {
    return Giants.findOne({name: Session.get("currentGiant")});
  }
}

/*SERVER*/

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  
}
