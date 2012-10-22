/*TODO
* me - profile management tool -> rename
* standing on logic
* search across the system before adding 
* bootstrap / nicer UI
*/
Giants = new Meteor.Collection("giants");

/*CLIENT*/

if (Meteor.isClient) {
  
  Template.app.userLogged = function() {
    if (Meteor.user() && Meteor.userLoaded()) {
      var userGiant = Giants.findOne({user_id: Meteor.userId()});
      if(!userGiant) { //fresh user, just registaered and we haven't created the corresponding giant yet
        var userEmail = Meteor.user().emails[0].address;
        Giants.insert({name: userEmail, added_by: Meteor.userId(), user_id: Meteor.userId()}); //creating a corresponding giant for the new user
        Session.set("selectedGiant", userGiant);
        Session.set("activeTab", "Me"); //redirecting the fresh user to profile management tab
      }
      Session.set("userGiant", userGiant);
      return true;
    }
  };
  
  Template.mainMenu.items = function() {
    var menuItems = [
      "Giants",
      "Feed",
      "Me"
    ];
    return menuItems;
  };
  
  /*top menu switcher*/
  
  Template.mainMenu.events({
    'click .mainMenuItem' : function() {
      Session.set("editGiantMode", false);
      Session.set("activeTab", this);
      if (this == "Me")
        Session.set("selectedGiant", Giants.findOne({user_id: Meteor.userId()}));
      if (this == "Giants")
        Session.set("selectedGiant", false);
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
    return Giants.find({added_by: Meteor.userId(), user_id: { $ne: Meteor.userId() }}); //not listing user's own giant!
  };
  
  Template.allGiants.events = ({
    'click .singleGiantLink' : function() {
      Session.set("selectedGiant", this);
    }
  });
  
  Template.giants.selectedGiant = function() {
    return Session.get("selectedGiant")
  };
  
  Template.singleGiantPage.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };
  
  Template.singleGiantPage.editGiantMode = function() {
    return Session.get("editGiantMode");
  }
  
  Template.singleGiantPage.events = ({
    'click #editGiantLink' : function() {
      Session.set("editGiantMode", true);
    },
  });

  Template.editGiantPage.myGiantPage = function() {
    if(Session.get("selectedGiant")._id == Session.get("userGiant")._id)
      return true;
  };
  
  Template.editGiantPage.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };
  
  Template.editGiantPage.events = ({
    'click #removeGiant' : function() {
      Giants.remove({_id: Session.get("selectedGiant")._id}); //future: we should not remove here. we should simply unlink so that current user's giant doesn't
      Session.set("selectedGiant", false);
    },
    'click #cancelEdit' : function() {
      Session.set("editGiantMode", false);
    },
    'click #saveGiantButton' : function() {
      var updatedGiant = Giants.findOne({_id: Session.get("selectedGiant")._id});
      if($("#newGiantName").val() == "") {
        alert("name can't be empty!");
      } else {
        updatedGiant.name = $("#newGiantName").val();
      }
      Giants.update({_id: Session.get("selectedGiant")._id}, updatedGiant);
      Session.set("editGiantMode", false);
    }
  });
}

/*SERVER*/

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  
}
