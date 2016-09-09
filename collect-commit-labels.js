const ghauth         = require('ghauth')
    , ghissues       = require('ghissues')
    , async          = require('async')

    , authOptions    = {
          configName : 'changelog-maker'
        , scopes     : ['repo']
      }


function collectCommitLabels (list, callback) {
  var sublist = list.filter(function (commit) {
    return typeof commit.ghIssue == 'number' && commit.ghUser && commit.ghProject
  })

  if (!sublist.length)
    return setImmediate(callback)

  ghauth(authOptions, function (err, authData) {
    if (err)
      return callback(err)
    var q = async.queue(function (commit, next) {
      function onFetch (err, issue) {
        if (err) {
          console.error('Error fetching issue #%s: %s', commit.ghIssue, err.message );
          return next()
        }

        if (issue.labels)
          commit.labels = issue.labels.map(function (label) { return label.name })
        // setTimeout(next(), 30)
        next()
      }

      if (commit.ghUser == 'iojs')
        commit.ghUser = 'nodejs' // forcably rewrite as the GH API doesn't do it for us

      ghissues.get(authData, commit.ghUser, commit.ghProject, commit.ghIssue, onFetch)
    }, 15)
    q.push(sublist)
    q.drain = callback
  })
}


module.exports = collectCommitLabels