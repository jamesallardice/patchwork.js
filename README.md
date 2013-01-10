patchwork.js
============

Patchwork is a little JavaScript utility that allows you to monkey-patch JavaScript constructor functions. Even native, built-in ones.

For those that know it by a different name, "[monkey patching](http://en.wikipedia.org/wiki/Monkey_patch)" is the process of modifying the behaviour of runtime code without changing the original source. You might commonly see it done like this:

```javascript
var realAlert = alert;
alert = function (message) {
    realAlert("Error: " + message);
};
```

There are many reasons you may want to monkey-patch JavaScript methods. This utility was born out of frustration with a bug in PhantomJS, which I was using for automated unit testing. By monkey-patching the native `Date` constructor, I can work around the issue in my unit test runner without having to change any of my code.

As you've seen above, it's nice and easy to patch functions like `alert`, and methods, like `String.prototype.toLowerCase` for example. But it's not as easy to patch constructor functions. That's where Patchwork comes in.

### The `patch` function

Patchwork exposes just one function. That's what you'll use to patch your constructors. The `patch` function takes three arguments:

 - `original` - a reference to the original constructor you want to patch
 - `originalRef` - a name for the reference to the original constructor
 - `patches` - an object containing at least one patch. This is described in more detail soon.

#### Example

Let's jump straight in with an example. This is a real-world use-case for the PhantomJS bug I mentioned earlier (Phantom doesn't like it when you construct a `Date` object with a string in the format "yyyy/mm"):

```javascript
Date = patch(Date, "DateOriginal", {
    constructed: function () {
        var args = [].slice.call(arguments);
        if (typeof args[0] === "string" && /^\d{4}\/\d{2}$/.test(args[0])) {
            args[0] = args[0] + "/02"; // Make sure the argument has a 'day'
        }
        return new (Function.prototype.bind.apply(DateOriginal, [{}].concat(args)));
    }
});
```

The body of the `constructed` function is not hugely important. Just know that this is what will run *instead of* the real constructor function. Because of that, if you want the effect of the real constructor too, you will have to call it. That's what the last line does. It may look confusing, but it's the only way to apply a variable number of arguments to a constructor.

#### The arguments

Let's look at the arguments from our previous example. The first one should be self-explanatory. That's a reference to the constructor you want to patch. The second is quite obvious too. That one's an identifier with which you'll be able to access to original constructor after the patch has run.

The third argument is more interesting. That's where we define our patch. It must always be an object, and it can have one or two keys:

 - `constructed` - defines a patch that runs when the constructor is invoked with the `new` operator
 - `called` - defines a patch that runs when the constructor is invoked *without* the `new` operator

The `constructed` option is the one you'll probably use most. You can get an idea of what it's actually done by running the example above and creating a new `Date` instance that matches the pattern:

```javascript
var myDate = new Date("1989/01");
console.log(myDate); // "Mon Jan 02 1989 00:00:00 GMT+0000 (GMT)"
```

You can tell that our patch has been executed because the date is "Mon Jan 02". If it hadn't run, it would be "Mon Jan 01".

The other option, `called` is used to modify the action of calling the constructor in question without the `new` operator. If you're not sure what I mean, consider the following simple example:

```javascript
console.log(String(20)); // "20"
```

In this example, the number 20 has been converted into the literal string "20". This is different to the action of invoking `String` with the `new` operator, which would have created an instance of `String` with the value of "20".

Let's patch `String` so it leaves numbers as numbers but converts everything else like usual:

```javascript
String = patch(String, "StringOriginal", {
    called: function (arg) {
        return  typeof arg === "number" ? arg : StringOriginal(arg);
    }
});
```

If we now call `String` with a couple of different inputs, we can see the patch in action:

```javascript
console.log(typeof String(true)); // "string"
console.log(typeof String(20)); // "number"
```

That's pretty much all there is to it! Enjoy.
