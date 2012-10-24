/*TODO
* fix the final bit of dwarf logc (search FIX HERE) - try changing order
* I should not be able to add myself (userGiant) to somebody's giants
* I should not be able to edit another giant if he is a user (?)
* search across the system before adding and display suggestion instead of alert or quietly adding
* implement backbone router for url parts handling (sync it with "activeTab"
* bootstrap / nicer UI
* add photo uploading with filepicker.io (meteor example on github)
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
    Session.set("activeTab", "Giants");
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
        var newUserGiantId = Giants.insert({name: userEmail, addedBy: Meteor.userId(), userId: Meteor.userId(), myGiants: [], myDwarfs: []}); //creating a corresponding giant for the new user
        Session.set("selectedGiant", Giants.findOne({userId: Meteor.userId()}));
        Session.set("editGiantMode", true);
        Session.set("activeTab", "Me"); //redirecting the fresh user to profile management tab
        userGiant = Giants.findOne(newUserGiantId);
      }
      Session.set("userGiant", userGiant);
      Session.set("selectedGiant", userGiant);
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
          //first check if this giant is already standing on him
          var alreadyStanding = false;
          for(i=0; i<selectedGiant.myGiants.length; i++) {
            if(selectedGiant.myGiants[i]._id == Giants.findOne({name: newGiantName})._id)
              alreadyStanding = true;
          }
          if(alreadyStanding) {
            alert("already standing!");
          } else {//if not already standing -> proceed to add
            //first update that giant.myDwarfs
            Giants.update({_id: Giants.findOne({name: newGiantName})._id}, {$push: {myDwarfs: {_id: Session.get("selectedGiant")._id}}});
            //second update selectedGiant.myGiants
            Giants.update({_id: Session.get("selectedGiant")._id},{$push: {myGiants: {_id: Giants.findOne({name: newGiantName})._id}}});
            console.log('added an existing giant!')//FIX - make it search and suggest!
          }
        } else { //no such giant in the DB yet, creating a new one
          newGiantId = Giants.insert({addedBy: Meteor.userId(), myDwarfs: [{_id: selectedGiant._id}], myGiants:[], name: newGiantName}); //create a new giant & don't forget to state that selected Giant is standing on his shoulders
        if(!selectedGiant.myGiants)
          selectedGiant.myGiants=[];
        selectedGiant.myGiants.push({_id: newGiantId});
        Giants.update({_id: selectedGiant._id}, selectedGiant); //update selected giant - push new item into his myGiants array
        }
        if(!(Session.get("selectedGiant") == Session.get("userGiant")))
          Session.set("selectedGiant", Giants.findOne(selectedGiant._id));
      }
    }
  });
  
  Template.singleGiantItem.editGiantMode = function() {
    return Session.get("editGiantMode");
  };
  
  Template.singleGiantItem.events = ({
    'click' : function() {
      Session.set("activeTab", "SingleGiant");
      Session.set("selectedGiant", Giants.findOne(this._id));
    }
  });
  
  Template.giants.selectedGiant = function() {
    return Session.get("selectedGiant")
  };
  
  Template.singleGiantPage.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };
  
  Template.singleGiantPage.itsMe = function() {
    return Session.get("selectedGiant")._id == Session.get("userGiant")._id;
  };
  
  Template.singleGiantPage.iAmStandingOnHim = function() {
    var result = false;
    for (i=0; i<Session.get("userGiant").myGiants.length; i++) {
      //console.log(Session.get("userGiant").myGiants[i]);
      if(Session.get("selectedGiant")._id == Session.get("userGiant").myGiants[i]._id)
        result = true;
    }
    return result;
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
    'click #addToMyGiants' : function() {
      //first update selectedGiant.mydwarfs
      Giants.update({_id: Session.get("selectedGiant")._id}, {$push : {myDwarfs: {_id: Session.get("userGiant")._id}}});
      //second update userGiant.myGiants
      Giants.update({_id: Session.get("userGiant")._id}, {$push : {myGiants: {_id: Session.get("selectedGiant")._id}}});
      //FIX reactivity tricks here: we don't need to jump out of this current context here
    },
    'click #removeFromMyGiants' : function() {
      //first update selectedGiant.mydwarfs
      var updatedSelectedGiant = Session.get("selectedGiant");
      var updatedMyDwarfs = [];
      for (i=0; i<updatedSelectedGiant.myDwarfs.length; i++) {
        if(!(updatedSelectedGiant.myDwarfs[i]._id == Session.get("userGiant")._id)) {
          updatedMyDwarfs.push(updatedSelectedGiant.myDwarfs[i]);
        }
      }
      updatedSelectedGiant.myDwarfs = updatedMyDwarfs;
      Giants.update({_id: Session.get("selectedGiant")._id}, updatedSelectedGiant);
      //second update userGiant.myGiants
      var updatedUserGiant = Session.get("userGiant");
      var updatedMyGiants = [];
      for (i=0; i<updatedUserGiant.myGiants.length; i++) {
        //console.log(Session.get("selectedGiant")._id);
        //console.log(updatedUserGiant.myGiants[i]._id);
        if(!(updatedUserGiant.myGiants[i]._id == Session.get("selectedGiant")._id)) {
          updatedMyGiants.push(updatedUserGiant.myGiants[i]);
        }
      }
      updatedUserGiant.myGiants = updatedMyGiants;
      Giants.update({_id: Session.get("userGiant")._id}, updatedUserGiant);
    }
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
  
  Template.areStandingOnMe.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };

  Template.areStandingOnMe.myDwarfs = function() {
    var selectedGiant = Giants.findOne({_id: Session.get("selectedGiant")._id});
    var allHisDwarfs = [];
    for (i=0; i<selectedGiant.myDwarfs.length; i++) {
      allHisDwarfs.push(Giants.findOne(selectedGiant.myDwarfs[i]._id));
    }
    return allHisDwarfs;
  };

  Template.editGiantPage.myGiantPage = function() {
    if(Session.get("selectedGiant")._id == Session.get("userGiant")._id)
      return true;
  };
  
  Template.editGiantPage.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };
  
  Template.editGiantPage.events = ({
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
