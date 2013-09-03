/*global Utils _*/
Utils = {};

Utils.validateUserName = function(name){
  return name && name.length>0 && name.length < 30 && name.match(/[A-Za-z0-9]+/);
};

Utils.validateName = function(name){
  return name.length>=0 && name.length < 50;
};

Utils.validateEmail = function(email){
  return email.match(/^[\w+\-]+(\.[\w+\-]+)*@([\w\-]+\.)+\w+$/i);
};

Utils.validatePassword = function(password){
  return password && password.length>=6;
};

Utils.formatTimeDelta = function(t){
};

Utils.tokenChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
Utils.genToken = function(){
  var ret = [];
  for(var i=0; i<20; i++){
    ret.push(Utils.tokenChars[_.random(0,Utils.tokenChars.length-1)]);
  }
  return ret.join('');
};

Utils.colors = {
'turquoise':     '#1abc9c',
'green-sea':     '#16a085',

'emerland':      '#2ecc71',
'nephritis':     '#27ae60',

'peter-river':   '#3498db',
'belize-hole':   '#2980b9',

'amethyst':      '#9b59b6',
'wisteria':      '#8e44ad',

'wet-asphalt':   '#34495e',
'midnight-blue': '#2c3e50',

'sun-flower':    '#f1c40f',
'orange':        '#f39c12',

'carrot':        '#e67e22',
'pumpkin':       '#d35400',

'alizarin':      '#e74c3c',
'pomegranate':   '#c0392b',

'clouds':        '#ecf0f1',
'silver':        '#bdc3c7',

'concrete':      '#95a5a6',
'asbestos':      '#7f8c8d',
};

Utils.colorsA = [
'#ffffff',
'#000000',
'#1abc9c',
'#16a085',
          
'#2ecc71',
'#27ae60',
          
'#3498db',
'#2980b9',
          
'#9b59b6',
'#8e44ad',
          
'#34495e',
'#2c3e50',
          
'#f1c40f',
'#f39c12',
          
'#e67e22',
'#d35400',
          
'#e74c3c',
'#c0392b',
          
'#ecf0f1',
'#bdc3c7',
          
'#95a5a6',
'#7f8c8d',
];

Utils.colorsAAlt = [
'#000000',
'#ffffff',

'#ffffff',
'#ffffff',
          
'#ffffff',
'#ffffff',
          
'#ffffff',
'#ffffff',
          
'#ffffff',
'#ffffff',
          
'#ffffff',
'#ffffff',
          
'#ffffff',
'#ffffff',
          
'#ffffff',
'#ffffff',
          
'#ffffff',
'#ffffff',
          
'#ffffff',
'#ffffff',
          
'#ffffff',
'#ffffff',
];

String.prototype.format = function() {
  var args = arguments;
  return this.replace(/\{(\d+)\}/g, function(match, number) {
    return typeof args[number] !== 'undefined'
      ? args[number]
      : match
    ;
  });
};


