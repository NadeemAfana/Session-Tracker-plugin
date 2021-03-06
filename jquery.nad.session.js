﻿/// <reference path="jquery-1.4.1.min-vsdoc.js"/>
/**
 * Session Tracker Plugin v1.0
 * Author:
 *      Nadeem Afana <http://afana.me>
 *      @NadeemAfana http://twitter.com/NadeemAfana
 * Copyright (c) 2010 Nadeem Afana - released under MIT License 
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:

 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
**/

(function ($) {

    var settings; 
    var $panel = null;
    var timeoutTimer = null;
    var expirationTimer = null;
    var canReset = false; 




    // Define a utility function
    $.sessionTrack = function (timeout, callerSettings) {

        // Apply default values
        settings = $.extend({
            showBefore: 2 * 60, // in seconds (default 2 minutes = 2* 60 seconds)        
            callbackUrl: location.href, // current location
            panelId: null, // in case of custom dialog box
            captionText: "Your session is about to expire!",
            renewText: "renew",
            ignoreText: "ignore",
            timeout: timeout, // seconds to wait before session expires
            redirectUrl: null, // Re-direct user to this URL after expiration instead of re-freshing current browser's window
            useIframes: false, // User IFrames instead of AJAX to refresh session.
            expireAfter: timeout, // The number of seconds before the ticket expires
            resetAfter: timeout / 2, // The number of seconds elapsed before ticket expiration time is reset. In ASP.NET, it's 1/2 of timeout.
            useBlock: true,  // Modally blocks screen with panel ID='session-block'            
            beforeExpire: function () { }, // does nothing. Runs when dialog box appears
            afterExpire: function () { } // does nothing. Runs when session has just expired before any othe action (e.g redirection). Returns false to supress re-direction or page refresh.

        }, callerSettings || {});

        if (settings.panelId == null) {
            
            $("body").append('<div style="display: none;" id="session-block"></div><div id="session-container" style="display: none;"><div id="session-background"><p></p> <div id="session-buttons"><input id="session-renew" type="button" value="renew" /> <input id="session-ignore" type="button" value="ignore" /> </div> </div></div>');

            
            $("#session-block").css({
                'background-color': '#DFDFFF',
                'height': '100%',
                'left': '0',
                'top': '0',
                'position': 'fixed',
                'width': '100%',
                'z-index': '10000'
            });

            $("#session-container").css({
                'left': '50%',
                'margin': '-6.4em 0 0 -7.3em',
                'position': 'absolute',
                'top': '50%',
                '-moz-border-radius': '5px',
                '-webkit-border-radius': '5px',
                '-moz-box-shadow': '0 0 10px rgba(0, 0, 0, 0.2)',
                'border': '1px solid #DFDFFF',
                'background-color': '#DFDFFF',
                'padding': '5px',
                'font-size': 'large',
                'font-weight': 'bold',
                'z-index': '100000'
            });


            $("#session-background").css({
                'padding': '20px',
                'background-color': '#ffff88'
            })
            .find("p").html(settings.captionText);



            $("#session-buttons").css({
                'text-align': 'center'
            });


            $("#session-renew").css({
                'margin-right': '40px'
            })
            .val(settings.renewText);


            $("#session-ignore").val(settings.ignoreText);


            $panel = $("#session-container"); 
        }
        else {
            $panel = $("#" + settings.panelId); 
        }


        
        resetTimeout();

        
        $("#session-ignore", $panel).click(function () {
            hideDialog();
        });

        $("#session-renew", $panel).click(function () {
            hideDialog();

            if (settings.useIframes) {
                var $iframe = $("#session-iframe");
                var query = settings.callbackUrl.indexOf("?") > 0 ? "&" : "?"; 
                query += "_nocache=" + 1 * new Date(); 
                if ($iframe.length == 0)
                    $("<iframe id='session-iframe' style='display:none;' />").attr("src", settings.callbackUrl + query).appendTo("body");
                else
                    $iframe.attr("src", settings.callbackUrl + query);
              
                resetTimeout();
            }
            else {
               
                $.get(settings.callbackUrl, { _nocache: 1 * new Date() });               
            }

        });

        var domain = extractDomain(settings.callbackUrl);

        if (domain == null)
            domain = extractDomain(window.location.href).toLowerCase(); 

        $panel.bind("ajaxSend", function (e, xhr, settings) {
          
            var request_domain = extractDomain(settings.url);
            if ((request_domain == null) || (request_domain.toLowerCase() == domain)) {
                resetTimeout();
            }

        });


    }

    var firstTime = true; 
    function resetTimeout() {


      
      
        if (!canReset && !firstTime) {
            return;
        }


      
        clearTimeout(timeoutTimer);
        clearTimeout(expirationTimer);

        if (!firstTime) {
        
            settings.expireAfter = settings.timeout;
        }
        else {
            firstTime = false; 
        }

      
        refreshReset();

       
        timeoutTimer = setTimeout(function () {

          
            settings.beforeExpire();

          
            showDialog();
        },

        (settings.expireAfter - settings.showBefore) * 1000 
        );

        
        expirationTimer = setTimeout(function () {

            if (settings.afterExpire() != false) {

                if (settings.redirectUrl != null) {
                    window.location.href = settings.redirectUrl;

                }
                else {
                    window.location.href = window.location.href;
                }
            }

            hideDialog();



        }, (3 + settings.expireAfter) * 1000);

    }

    function refreshReset() {
        canReset = false; 

        setTimeout(function () {
            canReset = true;
        }, (settings.resetAfter - settings.timeout + settings.expireAfter) * 1000); 

    }

    function showDialog() {
        if (settings.useBlock)
            $("#session-block").fadeTo('fast', 0.3);
        $panel.fadeIn("slow");

    }

    function hideDialog() {
        $panel.fadeOut("slow", function () {
            if (settings.useBlock) 
                $("#session-block").hide();
        });
    }

    function extractDomain(url) {

        if ((url.indexOf("http") != 0) && (url.indexOf("www") != 0))
            return null; 

        var url_match = /https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w/_\.]*(\?\S+)?)?)?/i;

        var domain = url.replace(url_match, "$1");
        return domain.replace("www.", "");
    }



})(jQuery);