(function () {

    "use strict";

    // Patch the String constructor to return the string "Patched!" if the argument is boolean. Do not patch normal (non `new`) calls.
    String = patch(String, "StringOriginal", {
        constructed: function () {
            var args = [].slice.call(arguments),
                strObj;
            if (typeof args[0] === "boolean") {
              args[0] = "Patched!";
            }
            strObj = new StringOriginal(args[0]);
            return strObj;
        }
    });

    test("Patch constructed (with the `new` operator) calls to a native constructor function", 9, function () {
        equal(String.length, StringOriginal.length, "The arity of the patched constructor matches the arity of the native constructor");
        equal(new String(false), "Patched!", "The patch has been successfully applied");
        equal(Object.prototype.toString.call(new String()), "[object String]", "Instances are of the correct type");
        ok(new String().toLowerCase, "Instances inherit methods of the native prototype");
        ok(new String().hasOwnProperty, "Instances inherit methods from Object.prototype");
        ok(String.fromCharCode, "Static methods of the native constructor are available");
        equal(String.constructor, Function, "The constructor of the patched constructor is the native Function constructor");
        equal(new String().constructor, String, "The constructor of instances created with the patched constructor is the patched constructor");
        ok(new String() instanceof String, "Instances of the patched constructor appear as instances of the patched constructor");
    });

    // Patch the Number constructor to always return 10 when called without the `new` operator
    Number = patch(Number, "NumberOriginal", {
        called: function () {
            return 10;
        }
    });

    test("Patch non-constructed (no `new` operator) calls to a native constructor function", 9, function () {
        equal(Number.length, NumberOriginal.length, "The arity of the patched constructor matches the arity of the native constructor");
        equal(Number(50), 10, "The patch overrides the native function");
        equal(new Number(20), 20, "The constructor behaves as expected when called with the new operator");
        equal(Object.prototype.toString.call(new Number()), "[object Number]", "Instances are of the correct type");
        ok(new Number().toFixed, "Instances inherit methods of the native prototype");
        ok(new Number().hasOwnProperty, "Instances inherit methods from Object.prototype");
        ok(Number.MAX_VALUE, "Static properties of the native constructor are available");
        equal(new Number().constructor, Number, "The constructor of instances created with the patched constructor is the patched constructor");
        ok(new Number() instanceof Number, "Instances of the patched constructor appear as instances of the patched constructor");
    });

    // Create a user-defined constructor function and patch it to enforce a minimum argument value
    function Example(name, age) {
        this.name = name;
        this.age = age;
    }
    Example.prototype.getName = function () {
        return this.name;
    };
    Example.create = function (name, age) {
        return new Example(name, age);
    };
    Example = patch(Example, "ExampleOriginal", {
        constructed: function (name, age) {
            if (age < 18) {
                age = 18;
            }
            return new ExampleOriginal(name, age);
        }
    });

    test("Patch a constructed user-defined constructor function", 9, function () {
        equal(Example.length, ExampleOriginal.length, "The arity of the patched constructor matches the arity of the original constructor");
        equal(new Example("test", 15).age, 18, "The patch has been successfully applied");
        equal(Object.prototype.toString.call(new Example()), "[object Object]", "Instances are of the correct type");
        ok(new Example().getName, "Instances inherit methods of the original prototype");
        ok(new Example().hasOwnProperty, "Instances inherit methods from Object.prototype");
        equal(Example.create("test", 15).age, 18, "Static methods of the original constructor are available");
        equal(Example.constructor, Function, "The constructor of the patched constructor is the native Function constructor");
        equal(new Example().constructor, Example, "The constructor of instances created with the patched constructor is the patched constructor");
        ok(new Example() instanceof Example, "Instances of the patched constructor appear as instances of the patched constructor");
    });

}());