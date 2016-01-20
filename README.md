# GH List

> A [web task](https://webtask.io/) to create lists of whatever you want (vote casting, attendees to your geek pizza party, players for your nerd soccer match) using GitHub issues

## Setting up a repo

Many steps, such easy

### 1) Set up a MongoDB database
- First of all, set up a MongoDB database that will be used to save the users voting in your repo. You can use [MongoLab](https://mongolab.com) which fits perfectly well for our purpose.
- Copy your [MongoDB URI](http://docs.mongolab.com/connecting/#connect-string) somewhere, we will need it later
  
### 2) Set up a GitHub token
- Create a [GitHub token](https://github.com/settings/tokens) with the `write:public_key` scope enabled
- Copy your token, somewhere, we will use it later

### 3) Initialize the webtask
- Install the [WebTask CLI](https://github.com/auth0/wt-cli) doing `npm install wt-cli -g` in your favourite console
- Run the following command: 
```
wt create --name gh-list https://raw.githubusercontent.com/nescalante/gh-list/master/src/main.js --secret MONGO_URL=$YOUR_MONGO_URL --secret GITHUB_TOKEN=$YOUR_TOKEN
```
- That command will return a URL, something like this: 
```
https://webtask.it.auth0.com/api/run/wt-foo-bar_com-0/my-repo?webtask_no_cache=1`
```
### 4) Set up a hook in your GitHub repo
- Go to `https://github.com/username_or_org/repo_name/settings/hooks` and click on the *Add webhook* button
- Into the Paylod URL field, paste the URL of your WebTask
- In the *Which events would you like to trigger this webhook?* section, select just *issues* and *issue comment*
- Add the webhook!

### 5) You are all set!
- Now you can open issues in your repo and call for votes or users to support that just commenting with a `+1`
- Of course you can delete yourself from any list just commenting with a `-1`
