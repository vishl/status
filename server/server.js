/*global Meteor Accounts Utils MF _ Messages*/
Meteor.startup(function () {
  // code to run on server at startup
});

Meteor.publish("userData", function () {
  return Meteor.users.find({_id:this.userId}, {fields: {sendList:1, receiveList:1, requestList:1, status:1, statusTime:1, token:1}});
});

Meteor.publish("friendUserData", function () {
  return Meteor.users.find({sendList:this.userId}, {fields: {'profile': 1, username:1, status:1, statusTime:1, sendList:1}});
});

Meteor.publish("allUserData", function () {
  return Meteor.users.find({}, {fields: {username:1, 'profile':1, sendList:1}});
});

Meteor.publish("requesters", function(){
  var currentUser = Meteor.users.findOne({_id:this.userId});
  if(currentUser){
    var requestList = currentUser.requestList;
    return Meteor.users.find({_id:{$in:requestList}}, {fields: {profile: 1, username:1}});
  }else{
    return null;
  }
});

Meteor.publish("messages", function () {
  return Messages.find(
    {$or:
      [
        {aboutId:this.userId},
        {otherId:this.userId}
      ]
    }
  );
});

Meteor.users.allow({
  update:function (userId, doc, fields, modifier){
    console.log("allow " + userId + "; " + doc._id + "; " + fields);
    if(doc._id!==userId){
      return false;
    }
    var ok = true;
    _.each(fields, function(f){
      if(!_.contains(["status", "statusTime", "token"], f)){
        console.log("whoops" + f);
        ok = false;
      }
    });
    console.log(ok);
    return ok;
  }
});

Accounts.onCreateUser(function(options, user){
  //validations
  if(!Utils.validateEmail(user.emails[0].address)){
    //error
    throw new Meteor.Error(403, "Invalid email");
  }
  if(!options.profile){
    //error
    throw new Meteor.Error(403, "Incomplete profile");
  }
  if(!Utils.validateName(options.profile.name)){
    //name error
    throw new Meteor.Error(403, "Invalid name");
  }

  user.profile = options.profile;

  //build friend list
  user.sendList = [];
  user.receiveList = [];
  user.requestList = [];
  user.status = "";
  user.statusTime = 0;
  user.token = Utils.genToken();
  return user;
});

/********************************** Methods *************************************/

var sendFollowRequest = function(from, to){
  console.log("Sending follow request from " + MF.userDisplayName(from) + " to " + MF.userDisplayName(to));
  var to_id = to._id;
  var from_id = from._id;
  if(!to_id || !from_id){
    throw new Meteor.Error(500, "User doesn't have id in follow request");
  }
  if(to_id === from_id){
    throw new Meteor.Error(400, "Can't friend yourself");
  }
  //if outstanding request, or on send list don't add to request list
  if(Meteor.users.findOne({_id:to_id, $or:[{'requestList':from_id}, {'sendList':from_id}]})){
    //do nothing
  }else{
    Meteor.users.update({_id:to_id}, {$push : {'requestList' : from_id}});  //request to follow recipient
  }
  Meteor.users.update({_id:from_id}, {$push : {'receiveList' : to_id}});  //check for updates from recipient
};

var allowFollow = function(from, to){
  console.log("Allowing " + MF.userDisplayName(from) + " to follow " + MF.userDisplayName(to));
  var to_id = to._id;
  var from_id = from._id;
  if(!to_id || !from_id){
    throw new Meteor.Error(500, "User doesn't have id in follow request");
  }
  //remove from request list
  Meteor.users.update({_id:to_id, 'requestList':from_id}, {$pull:{'requestList':from_id}});
  //don't push if already on sendlist
  if(!Meteor.users.findOne({_id:to_id, 'sendList':from_id})){
    Meteor.users.update({_id:to_id}, {$push : {'sendList' : from_id}});
  }
};

var rejectFollow = function(from, to){
  console.log("Allowing " + MF.userDisplayName(from) + " to follow " + MF.userDisplayName(to));
  var to_id = to._id;
  var from_id = from._id;
  if(!to_id || !from_id){
    throw new Meteor.Error(500, "User doesn't have id in follow request");
  }
  //remove from request list
  Meteor.users.update({_id:to_id, 'requestList':from_id}, {$pull:{'requestList':from_id}});
};

var handleFollow = function(sender, recipient, followback){
  if(recipient){
    sendFollowRequest(sender, recipient);
    if(followback){
      allowFollow(recipient, sender);
    }
  }
};

var handleApprove = function(authorizer, requester, followback){
  if(requester){
    allowFollow(requester, authorizer);
    if(followback){
      sendFollowRequest(authorizer, requester);
    }
  }
};

var handleReject = function(authorizer, requester){
  if(requester){
    rejectFollow(requester, authorizer);
  }
};

Meteor.methods({
  followByEmail : function(query, followback){
    if(!Utils.validateEmail(query)){
      throw new Meteor.Error(400, "Invalid email address");
    }

    var targetUser = Meteor.users.findOne({"emails.address":query});
    var currentUser = Meteor.users.findOne({_id:this.userId});

    handleFollow(currentUser, targetUser, followback);
    
    return targetUser;
  },

  followByUsername : function(query, followback){
    console.log('Follow by username');
    if(!Utils.validateUserName(query)){
      throw new Meteor.Error(400, "Invalid username:[" + query+"]");
    }

    var currentUser = Meteor.users.findOne({_id:this.userId});
    var targetUser = Meteor.users.findOne({"username":query});

    handleFollow(currentUser, targetUser, followback);
    
    return targetUser;
  },

  approveFollow : function(id, followback){
    console.log('Approve follow');

    var currentUser = Meteor.users.findOne({_id:this.userId});
    var targetUser = Meteor.users.findOne({_id:id});

    handleApprove(currentUser, targetUser, followback);
    
    return targetUser;
  },
  rejectFollow : function(id, followback){
    console.log('Approve follow');

    var currentUser = Meteor.users.findOne({_id:this.userId});
    var targetUser = Meteor.users.findOne({_id:id});

    handleReject(currentUser, targetUser, followback);
    
    return targetUser;
  },
  removeFromSendList : function(id){
    console.log("remove from send list: " + this.userId, + "; " + id);
    Meteor.users.update({_id:this.userId}, {$pull:{sendList:id}});
  },
  removeFromReceiveList : function(id){
    Meteor.users.update({_id:this.userId}, {$pull:{receiveList:id}});
  },
});
