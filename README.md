### **REPEAT** binding for [Knockout](http://knockoutjs.com/)

The `repeat` binding can replace `foreach` in many instances and is faster and simpler for some tasks.
In contrast to `foreach`:

* `repeat` does not create a new binding context. Therefore, the variables for the binding context
    (`$data`, `$parent`, and `$parents`) are unaffected. Instead, you can access the current item using
    `$item()` and `$index`.
* `repeat` operates on the outer HTML instead of the inner HTML.
* `repeat` can either loop a number of times (`count`) or iterate over an array or observableArray (`foreach`).
* `repeat` avoids excessive re-rendering of DOM nodes by updating only the child bindings when the view model changes.

Here’s a comparison between `foreach` and `repeat` for a data table:

```html
<table>
    <tbody data-bind="foreach: data">
        <tr data-bind="foreach: $parent.columns">
            <td data-bind="text: $parent[$data.propertyName]"></td>
        </tr>
    </tbody>
</table>

<table>
    <tbody>
        <tr data-bind="repeat: { foreach: data, item: '$row' }">
            <td data-bind="repeat: { foreach: columns, item: '$col' }"
                data-repeat-bind="text: $row()[$col().propertyName]"></td>
        </tr>
    </tbody>
</table>
```

#### Main Parameters

The `repeat` binding accepts a single parameter of the number of repetitions or an array to iterate. It also accepts an object literal with these parameters provided through the `count` or `foreach` property. If the parameter is an observable, the `repeat` binding will add or remove elements whenever you update it. Here are the main parameters:

* `foreach` — an array (or observableArray) over which to iterate, or the number of repetitions
* `count` — the number of repetitions. If both the `foreach` and (non-zero) `count` parameters are given, the `count` value takes precedence. This allows you to provide an array using `foreach` but always output a fixed number of items, even if it’s larger than the array length.
* `limit` — an upper limit on the number of repetitions, if non-zero (optional)

The following optional parameters do not support updates (and can’t be observable):

* `reverse` — if `true`, the elements will be repeated in reverse order, with the lowest value at the bottom and items added to the top (default is `false`)
* `step` — the increment value (default is `1`)
* `index` — the name of the index context property (default is `$index`; see section below)
* `item` — the name of the context property used to access the item in the array (default is `$item`; see section below)
* `bind` — the binding used for the repeated elements (see section below)

#### Context Properties

The `repeat` binding makes the following context properties available to bindings in the repeated nodes.

* `$index` — the zero-based index of the current item. The name of this property can be changed using the `index` option.
* `$item` — the array item matching the current index. This property in available only when an array is supplied to the `repeat` binding. It is a pseudo-observable, which can be passed directly to bindings that accept observables (most do), including two-way bindings; or the item value can be accessed using observable syntax: `$item()`. The name of this property can be changed using the `item` option.

#### Repeated Element Binding

The `repeat` binding allows you to specify the binding for the repeated elements in a number of ways. Note that you cannot do this in the normal way you set additional bindings for an element—for example, `<span data-bind="repeat: 5, text: $index">` will not set the text of the repeated elements and will probably generate an error.

1. The simplest and cleanest way is to use a `data-repeat-bind` attribute, which becomes the `data-bind` attribute of the repeated elements.

    ```html
    <span data-bind="repeat: 5" data-repeat-bind="text: $index">
    ```

2. Similarly, you can specify a binding string using the `bind` parameter to `repeat`.

    ```html
    <span data-bind="repeat: { count: 5, bind: 'text: $index' }">
    ```

3. If you are using a custom binding provider that doesn’t support the standard binding method of using a `data-bind` attribute, you can specify the binding for repeated elements using a function provided through the `bind` parameter to `repeat`. If using this option with `foreach`, the first parameter to the function is the *item* and the second is the *index*. If used with just `count`, the first parameter is the *index*. In both cases, the last parameter to the function is the binding context object, which is useful if you want to access additional context properties such as `$parent`.

    ```html
    <span data-bind="repeat: { count: 5, bind: function($index) { return { text: $index } } }">
    ```

    ```html
    <div data-bind="repeat: { foreach: availableCountries, item: '$country',
        bind: function($country) { return { css: { sel: $country() == selectedCountry() } } } }">
        <span data-bind="text: $index+1"></span>. <span data-bind="text: $country"></span>
    </div>
    ```

#### License and Contact

**License:** MIT (http://www.opensource.org/licenses/mit-license.php)

Michael Best<br>
https://github.com/mbest<br>
mbest@dasya.com
