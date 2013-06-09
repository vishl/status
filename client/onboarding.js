/*global Meteor Template Session Utils Accounts _ MF mixpanel*/

Template.header.events({
  'click #signout' : function(event, template){
    Meteor.logout();
  },

  'click #settings' : function(event, template){
    Session.set('settingsError', null);
    $('#settings-modal').modal('show');
  },

//  'click #sharing' : function(e, t){
//    Session.set('sharingPage', true);
//  },

  'click #findfriends' : function(e,t){
    $('#findfriends-modal').modal('show');
    Session.set('findFriendError', null);
    Session.set('findFriendMessage', null);
  },

//  'click .brand' : function(e,t){
//    e.preventDefault();
//    Session.set('sharingPage', false);
//  },
});

Template.header.userName = function(){
  return MF.userDisplayName(Meteor.user());
};

Template.header.email = function(){
  return Meteor.user().emails[0].address;
};

Template.onboarding.isLogin = function(){
  return Session.get('isLogin');
};

Template.onboarding.friendUser = function(){
  return Session.get('destinationUserName');
};

Template.onboarding.friendDisplayName = function(){
  var user = Session.get("destinationUserName");
  var u = Meteor.users.findOne({username:user});
  return MF.userDisplayName(u);
};

Template.onboarding.friendUserName = function(){
  var user = Session.get("destinationUserName");
  var u = Meteor.users.findOne({username:user});
  if(u){
    return u.username;
  }
  return "";
};

Template.login.events({
  'submit form' : function(event, template){
    event.preventDefault();

    var email = template.find('#account-email').value;
    var password = template.find('#account-password').value;

    Meteor.loginWithPassword(email, password, function(err){
      if(err){
        $(template.find('#account-password')).val('');
        if(err.reason){
          Session.set('loginError', err.reason);
        }else{
          Session.set('loginError', 'Invalid email or password');
        }
      }else{
        //nothing
        mixpanel.track("Login");
      }
    });
  },
  'click #switch-create' : function(event, template){
    Session.set('loginError', false);
    Session.set('isLogin', false);
  },
});

Template.login.error = function(){
  return Session.get('loginError');
};

Template.signup.events({
  'submit form' : function(event, template){
    event.preventDefault();
    var name = template.find('#account-name').value;
    var username = template.find('#account-username').value;
    var email = template.find('#account-email').value;
    var password = template.find('#account-password').value;
    if(!Utils.validateName(name)){
      Session.set('loginError', 'Please enter a name between 1 and 50 characters');
    }else if(!Utils.validateUserName(username)){
      Session.set('loginError', 'Username must be number, letters, and no spaces');
    }else if(false && !Utils.validateEmail(email)){
      Session.set('loginError', 'Please enter a valid email');
    }else if(!Utils.validatePassword(password)){
      Session.set('loginError', 'Please enter a password of at least 6 characters');
    }else{
      //valid info, call accounts and see if that works
      Accounts.createUser({email:email, password:password, username:username, profile:{name:name}},
                          function(err){
                            if(err){
                              if(err.reason){
                                Session.set('loginError', err.reason);
                              }else{
                                Session.set('loginError', 'Error creating account');
                              }
                              console.log(err);
                            }else{
                              Session.set('loginError', false);
                              mixpanel.track("Sign up");
                            }
                          });
    }

  },
  'click #switch-login' : function(event, template){
    Session.set('loginError', false);
    Session.set('isLogin', true);
  },
});

Template.signup.error = function(){
  return Session.get('loginError');
};

