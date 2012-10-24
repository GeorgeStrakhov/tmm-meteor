/*TODO
* sort out Selected Giant thingfix standing on logic (now everybody is standing on everybody if added from the SingleGiantPage and renaming doesn't fully work
* add people standing on him logic
* search across the system before adding and display suggestion instead of alert
* implement backbone router for url parts handling 
* bootstrap / nicer UI
*/
Giants = new Meteor.Collection("giants");

/*CLIENT*/

if (Meteor.isClient) {

  Meteor.startup(function() {
    Session.set("menuItems", [
      {name: "Giants", text: "Giants", isActive: false},
      {name: "Feed", text: "feed", isActive: false},
      {name: "Me", text: "me", isActive: false}
    ]);
  });
  
  /*different *reactive* helper functions for the Client start here*/
  
  Meteor.autosubscribe(function () { //this makes shure that "activeTab" and and "menuItems"[i].isActive are in sync
    Meteor.subscribe("activeTab", Session.get("activeTab"));
    newMenuItems = Session.get("menuItems");
    if(newMenuItems) { //in case something is not loaded yet
      for (i=0; i<newMenuItems.length; i++) { //switching the active menu tab here.
        if(newMenuItems[i].name == Session.get("activeTab")) {
          newMenuItems[i].isActive = true;
        } else {
          newMenuItems[i].isActive = false;
        }
      }
      Session.set("menuItems", newMenuItems);
    }
  });
  
  Meteor.autosubscribe(function() { //this selects userGiant if no other giant is selected. ugly but works for now
    Meteor.subscribe("selectedGiant", Session.get("selectedGiant"));
    //console.log(Session.get("selectedGiant"));
    if(!Session.get("selectedGiant"))
      Session.set("selectedGiant", Session.get("userGiant"));
  });
  
  /* end of helper functions */
  
  Template.app.userLogged = function() {
    if (Meteor.user() && Meteor.userLoaded()) {
      var userGiant = Giants.findOne({userId: Meteor.userId()});
      if(!userGiant) { //fresh user, just registaered and we haven't created the corresponding giant yet
        var userEmail = Meteor.user().emails[0].address;
        var newUserGiantId = Giants.insert({name: userEmail, addedBy: Meteor.userId(), userId: Meteor.userId()}); //creating a corresponding giant for the new user
        Session.set("selectedGiant", Giants.findOne({userId: Meteor.userId()}));
        Session.set("editGiantMode", true);
        Session.set("activeTab", "Me"); //redirecting the fresh user to profile management tab
        userGiant = Giants.findOne(newUserGiantId);
      }
      Session.set("userGiant", userGiant);
      return true;
    }
  };
  
  Template.mainMenu.items = function() {
    return Session.get("menuItems");
  };
  
  Template.mainMenu.events({
    'click .mainMenuItem' : function() {
      Session.set("editGiantMode", false);
      Session.set("activeTab", this.name);
      if (this.name == "Me")
        Session.set("selectedGiant", Giants.findOne({userId: Meteor.userId()}));
      if (this.name == "Giants")
        Session.set("selectedGiant", Session.get("userGiant"));
    },
  });
  
  Template.myApp.activeTab = function(tab) {
    //console.log(tab);
    //console.log(Session.get("activeTab") == tab);
    return Session.get("activeTab") == tab; //returns true if this is the active tab (tab is passed from the template). read more here: http://docs.meteor.com/#templates
  };
  
  Template.giants.noGiants = function() {
    if(Giants.find({addedBy: Meteor.userId(), userId: { $ne: Meteor.userId() }}).count() === 0)
      return true;
  };
  
  Template.addGiant.editGiantMode = function() {
    return Session.get("editGiantMode");
  };
  
  Template.addGiant.events = ({
    'click #addGiantLink' : function() {
      $(".addGiantForm").toggle();
    },
    'click #addGiantButton' : function() {
      if($("#newGiantName").val() == "") {
        alert("please enter name!");
      } else {
        var selectedGiant = Session.get("selectedGiant");
        if(!selectedGiant)
          selectedGiant = Session.get("userGiant");
        //console.log(selectedGiant);
        var newGiantName = $("#newGiantName").val();
        var newGiantId;
        if(Giants.findOne({name: newGiantName})) { //if there is a giant with such name
          alert("such a giant exists!");
        } else { //no such giant in the DB yet, creating a new one
          newGiantId = Giants.insert({addedBy: Meteor.userId(), myDwarfs: [{name: selectedGiant.name, dwarfId: selectedGiant._id}], name: newGiantName}); //create a new giant & don't forget to state that selected Giant is standing on his shoulders
        }
        if (!selectedGiant.myGiants)
          selectedGiant.myGiants = []; //FIX HERE(!)
        selectedGiant.myGiants.push({_id: newGiantId});
        Giants.update({_id: selectedGiant._id}, selectedGiant); //update selected giant to state that this selected Giant's giant is standing on this giant (dude, that's unreadable ;((( sorry)
        if(!(Session.get("selectedGiant") == Session.get("userGiant")))
          Session.set("selectedGiant", Giants.findOne(selectedGiant._id));
      }
    }
  });
  
  Template.singleGiantItem.editGiantMode = function() {
    return Session.get("editGiantMode");
  };
  
  Template.giants.selectedGiant = function() {
    return Session.get("selectedGiant")
  };
  
  Template.singleGiantPage.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };
  
  Template.singleGiantPage.myGiantsTab = function() { //if we're on the myGiants tab where we only display the list of giants userGiant is standing on
    return Session.get("activeTab") == "Giants";
  };
  
  Template.singleGiantPage.editGiantMode = function() {
    return Session.get("editGiantMode");
  }
  
  Template.singleGiantPage.events = ({
    'click #editGiantLink' : function() {
      Session.set("editGiantMode", true);
    },
  });
  
  Template.isStandingOn.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };
  
  Template.isStandingOn.myGiantsTab = function() {
    return Session.get("activeTab") == "Giants";
  };
  
  Template.isStandingOn.myGiants = function() { //we need to define this separately since calling giant.Mygiants inside the template will only give the list of _id back
    var selectedGiant = Giants.findOne({_id: Session.get("selectedGiant")._id});
    var allHisGiants = [];
    if(selectedGiant.myGiants){
      for (i=0; i<selectedGiant.myGiants.length; i++) {
        if(selectedGiant.myGiants[i]._id){
          allHisGiants.push(Giants.findOne(selectedGiant.myGiants[i]._id));
        }
      }
    }
    //console.log(allHisGiants);
    return allHisGiants;
  };
  
  Template.isStandingOn.events = ({
    'click .singleGiantLink' : function() {
      //console.log(this);
      Session.set("activeTab", "SingleGiant");
      Session.set("selectedGiant", Giants.findOne(this._id));
    }
  });
  
  Template.areStandingOnMe.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };

  Template.areStandingOnMe.myDwarfs = function() {
    var userGiant = Giants.findOne({_id: Session.get("userGiant")._id});
    return userGiant.myDwarfs;
  };

  Template.editGiantPage.myGiantPage = function() {
    if(Session.get("selectedGiant")._id == Session.get("userGiant")._id)
      return true;
  };
  
  Template.editGiantPage.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };
  
  Template.editGiantPage.events = ({
    'click #removeGiant' : function() {
      //Giants.remove({_id: Session.get("selectedGiant")._id}); //future: we should not remove here. we should simply unlink so that current user's giant doesn't
      Session.set("selectedGiant", Session.get("userGiant"));
    },
    'click #cancelEdit' : function() {
      Session.set("editGiantMode", false);
    },
    'click #saveGiantButton' : function() {
      var updatedGiant = Giants.findOne({_id: Session.get("selectedGiant")._id});
      //new name
      if($("#newGiantName").val() == "") {
        alert("name can't be empty!");
      } else if (Giants.findOne({name: $("#newGiantName").val()}) && !(Session.get("selectedGiant")._id == Giants.findOne({name: $("#newGiantName").val()})._id)) { //such a giant already exists and it's not this very one
        alert("giant with this name already exists!");
      } else {
        updatedGiant.name = $("#newGiantName").val();
        //new description
        updatedGiant.description = $("#newGiantDescription").val();
        //new connections
          //underconstruction...
        Giants.update({_id: Session.get("selectedGiant")._id}, updatedGiant);
        Session.set("editGiantMode", false);
      }
    }
  });
}

/*SERVER*/

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  
}
