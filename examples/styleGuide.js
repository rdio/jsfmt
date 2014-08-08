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
    // TODO: Should wrap to one line or indent properly
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

  // TODO: This `else` comment should align with the subsequent statement
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

  // TODO: Wrap + indent accessor expression
  var myVar = new myVarTypes[
    'A type']();

  // TODO: Indent call args if wrapped
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

  // TODO: Should indent to same level as `var`
  var nestedObjects = [{
    a: true
    }, {
    a: false
  }];

}).call(this);

(function() {
  console.log('This is another block');
})();
