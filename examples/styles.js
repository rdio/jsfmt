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

  var anotherFun = function() {
    return "another" + "Fun";
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

  try {
    throw new Error("Whoa now");
  } catch (err) {
    console.error(err);
  }

}).call(this);

(function() {
  console.log('This is another block');
})();
