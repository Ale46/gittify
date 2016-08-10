// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function (tab) {

    // get current selected tab
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {

        var activeTab = arrayOfTabs[0];

        var url = "https://api.github.com/repos/:owner/:repo/contents/:path?access_token=:token";

        var replacements = [
            ':owner',
            ':repo',
            ':path',
            ':token'
        ];

        // update url
        $.each(replacements, function (key, item) {
            var value = get(item.replace(':', ''));
            url = url.replace(item, value);
        });

        // get file content
        $.get(url, function (response) {
            var sha = response.sha,
                    content = decodeURIComponent(escape(window.atob(response.content)));
            // If the file is empty
            if ($.trim(content) === '') {
                content = getContentTemplate(true, content)
            }else
                content = getContentTemplate(false, content);
            commit("New link: " + activeTab.title, content, sha)
        }).fail(function (jqXHR, textStatus, error) {
            if (error === 'Not Found'){
                var content = getContentTemplate(true);
                commit("New link: " + activeTab.title, content);

            }else{
                setErrorIcon();
            }
        });

        function getData(url, readify){
            return new Promise(function(resolve, reject) {
                var base_url = '';
                if (readify)
                    base_url = "https://readability.com/api/content/v1/parser?url="+ encodeURIComponent(url) + "&token=" + get('readability_token');
                else
                    base_url = url;
                var data = '';
                var jqxhr = $.ajax(base_url)
                  .done(function(data) {
                    resolve(data);
                  })
                  .fail(function() {
                    reject(Error(""));
                  });
              });
        }
        /*
         * Return true if you choose to save as markdown
         *
         * @return {bool}
         */
        function saveAsMarkdown(){
            return get('type') == 0 ? true : false;
        }
        /**
         * Save the content of the html-striped-readifyed markdown
         *
         */
        function saveContent(url, title, isMarkdown){
            var path = getPath(isMarkdown);
            getData(url, isMarkdown & isReadifable()).then(function(content){
                if (isMarkdown && content !== '' && isReadifable())
                    content = $(markdownify(content.content)).text();
                commit(title, content, null, path); //new file, no sha needed
            });

        }

        /**
         *Make a commit
         *
         *@param title, content, path
         */

         function commit(message, content, sha = null, path = null){
            var filepath = path;
            var push_url = url;

            if (path == null){
                filepath = get('path');
            }else{ //new file
                push_url = url.replace(get('path'), filepath)
            }
            var new_content = {
              message: message,
              committer: {
                "name": get('committer_name'),
                "email": get('committer_email')
              },
              "content": window.btoa(unescape(encodeURIComponent(content)))
            };
            if (sha != null){ //it's an update, include sha
                new_content['sha'] = sha;
            }
            // send commit
            $.ajax({
                method: "PUT",
                url: push_url,
                headers: {
                    'Content-Type': 'application/json'
                },
                dataType: 'json',
                data: JSON.stringify(new_content),
                before: function () {
                    setProcessingIcon();
                },
                success: function (response) {
                    setSuccessIcon();
                },
                error: function (error) {
                    setErrorIcon();
                }
            });
            if (get('save_data') && path == null)
                saveContent(activeTab.url, activeTab.title, saveAsMarkdown());
         }

        /**
         * Return a markdown text from a string
         *
         * @param html, ghmark
         * @returns {string}
         */
        function markdownify(html, ghmark = true){
            return toMarkdown(html, { gfm: ghmark });
        }

        /**
         * Get value from storage
         *
         * @param val
         * @returns {string}
         */
        function get(val) {
            if (localStorage.getItem(val)) {
                return localStorage.getItem(val);
            }
            return "";
        }

        /**
         * Return date header
         *
         * @returns {string}
         */
        function getDateHeader() {
            return "\n### " + getCurrentDate() + '\n';
        }

        /**
         * Check if current date already exists in the content
         *
         * @param content
         * @returns {boolean}
         */
        function isCurrentDateExists(content) {
            return (content.indexOf(getCurrentDate()) !== -1);
        }

        /**
         * Return current
         *
         * @returns {string}
         */
        function getCurrentDate() {
            var date = new Date();
            return monthNames()[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
        }

        /**
         * Return month names
         *
         * @returns {string[]}
         */
        function monthNames() {
            return [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
        }

        /**
         * Pad 0 if number is less than 10
         *
         * @param n
         * @returns {string}
         */
        function pad(n) {
            return (n < 10) ? ("0" + n) : n;
        }

        /**
         * Set default icon
         */
        function setDefaultIcon() {
            sleep(1000).then(() => {
                chrome.browserAction.setIcon({path: "icons/standard-16.png"});
            });
        }

        /**
         * Set success icon
         */
        function setSuccessIcon() {
            chrome.browserAction.setIcon({path: "icons/check-mark.png"});
            setDefaultIcon()
        }

        /**
         * Set error icon
         */
        function setErrorIcon() {
            chrome.browserAction.setIcon({path: "icons/cross-mark.png"});
            setDefaultIcon();
        }

        /**
         * Set loading icon
         */
         function setProcessingIcon(text = "..."){
            chrome.browserAction.setBadgeText ( { text: text } );
         }

        /**
         * Return a date string used to manage the articles saved
         *
         * @returns {string}
         */

        function getDatePath(){
            var date = new Date();
            return pad(date.getDate()) + "-" + pad(date.getMonth()+1) + "-" + date.getFullYear();
        }

        /**
         * Return the path+filename
         *
         * @returns {string}
         */
        function getPath(){
            if (saveAsMarkdown() && isReadifable())
                return getDatePath()+ "/"+ clearTitle() +".md";
            else
                return getDatePath()+ "/"+ clearTitle() +  getExt();
        }
        /**
         * Return the title striped of unwanted chars
         *
         * @returns {string}
         */
        function clearTitle(){
            var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
            var regex = new RegExp(expression);
            var title = activeTab.title;
            if (title.match(regex)){
                title = title.substr(title.lastIndexOf('/')+1);
            }
            if (title.indexOf('/') >= 0){
                return title.replace('/', '-');
            }
            return title;
        }

        /**
         * Return the current file extensions of the active tab
         *
         * @returns {string}
         */
         function getExt(){
            var dot = activeTab.url.lastIndexOf('.');
            var extension = activeTab.url.substr(dot+1);
            if (extension != null && (extension.length >= 0 && extension.length < 5))
                return "." + extension;
            else
                return ".html";
         }

         /**
          * Return the :path file template
          *
          * @params header, content
          * @returns {string}
          */
         function getContentTemplate(header = false, content = null){
            var content = header ? "# today-i-liked  \n" : content;
            // append header
            if (!isCurrentDateExists(content)) {
                content += getDateHeader();
            }
            // append url
            content += "- [" + activeTab.title + "](" + activeTab.url + ")";
            if (get('save_data'))
                content +=  " | [Local Copy](" + getPath() + ")\n"

            return content;
         }

         function isReadifable(){
            var isReadifable = [".html", ".htm", ".asp", ".txt", ".php"].indexOf(getExt()) >= 0 ? true : false;
            return isReadifable;

         }

        /**
         * Sleep execution
         *
         * @param time
         * @returns {boolean}
         */
        function sleep(time) {
            return new Promise((resolve) => setTimeout(resolve, time));
        }
    });

});
