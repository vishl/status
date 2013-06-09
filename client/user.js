/*global Meteor Template Session Utils Accounts _ MF mixpanel*/

Template.userPage.events({
  'click #request' : function(e,t){
    e.preventDefault();
    var user = Session.get("destinationUserName");
    var followback = $(t.find('#share')).prop('checked');

    Meteor.call('followByUsername', user, followback, function(error, result){
      if(error){
        var e = error.reason? error.reason : 'There was an error';
        Session.set('findFriendError', e);
      }else{
        if(result){
          Session.set('findFriendError', null);
          Session.set('findFriendMessage', 'We sent a request to ' + MF.userDisplayName(result));
          mixpanel.track("Friend request", {type:'userpage'});
        }else{
          Session.set('findFriendMessage', null);
          Session.set('findFriendError', 'Could not find anyone with that username');
        }
      }
    });
  },

});

Template.userPage.userDisplayName = function(){
  var user = Session.get("destinationUserName");
  var u = Meteor.users.findOne({username:user});
  return MF.userDisplayName(u);
};

Template.userPage.username = function(){
  var user = Session.get("destinationUserName");
  var u = Meteor.users.findOne({username:user});
  if(u){
    return u.username;
  }
  return "";
};
