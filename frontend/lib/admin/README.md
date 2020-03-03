The files in this directory constitute front-end code for administrative
users.

Given that a different kind of audience uses the admin interface, we
have different requirements for such code. We currently assume
that admin users have the following characteristics (though this
is subject to change in the future):

  * They are on a desktop browser. (Don't worry too much about mobile.)

  * They have a fast, non-metered internet connection. (Don't worry
    too much about minimizing bandwidth usage.)

  * They are using a modern browser with JavaScript enabled. (Don't
    worry too much about progressive enhancement, or generally
    supporting browsers that are more than a few versions old.)

  * They can read and write English fluently. (Don't worry
    too much about internationalization and localization.)

  * There aren't that many of them. (Don't worry too much about
    scalability.)

As such, however, we should be careful about using code in this
folder from code outside of it.  (The reverse is fine, of course,
since it's developed with fewer assumptions.)

To help ensure that this doesn't happen accidentally via e.g.
[Visual Studio Code's automatic imports][autoimport], the
names of many exports have the word "admin" in them, so that
someone including them in a non-admin page will be forced
to question whether they should be using the export.

[autoimport]: https://code.visualstudio.com/docs/languages/javascript#_auto-imports
