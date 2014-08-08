(function() {

  var test = "This is a sample declaration.";

  var arr = [
    0,
    1,
    2,
    3
  ];

  var a, b, c;
  var another = test;

  var sum = 0;
  for (var i = 0; i < test.length; i++) {
    sum += i;
  }

  function fun(num) {
    if (num > 100) {
      return num;
    }

    return num * fun(num);
  }

  var anotherFun = function(a, b, c) {
    return a == "a" ||
      b == "b" ||
      c == "c";
  };

  var myObj = {
    hello: "world"
  };

  switch (myObj.hello) {
    case "world":
      alert(test);
      break;
    default:
      alert(myObj.hello);
      break;
  }

  var that = "Empty";

  function then(that) {
    return that;
  }

  // This is a test of conditional wrapping
  if (this) {
    then(that);

  } else if (that) {
    then(this);

  } else {
    console.error("Wat?");
  }

  console.log("After if/else if/else conditional");

  if (this) {
    then(that);
  } else if (that) {
    then(this);
  }

  console.log("After if/else if conditional");

  try {
    throw new Error("Whoa now");
  } catch ( err ) {
    console.error(err);
  }

  var str = '<span>' + fun([
    1, 2, 3
  ]) + '</span>';

  // TODO: Keep indentation of BinaryOperators inside function call args
  $(document.body).append('<li>' +
  myVar.toString() +
  '</li>');

  var myVar = new myVarTypes[
    'A type']();

  callFunc(
    'An arg',
    'Another arg',
    [
      'Some final args'
    ]
  );

  // TODO: Indent in-line with `if` or don't wrap object expression inside conditional
  if (!this.model.set(values, {
      validate: true
    })) {
    return;
  }

  var nestedObjects = [{
    a: true
    }, {
    a: false
  }];

}).call(this);

(function() {
  console.log('This is another block');
})();
