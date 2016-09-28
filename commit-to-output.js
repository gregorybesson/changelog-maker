const chalk   = require('chalk')
    , reverts = require('./reverts')
    , groups  = require('./groups')


function cleanMarkdown (txt) {
  // just escape '[' & ']'
  return txt.replace(/([\[\]])/g, '\\$1')
}


function toStringSimple (data) {
  var s = ''
  s += '* [' + data.sha.substr(0, 10) + '] - '
  s += (data.semver || []).length ? '(' + data.semver.join(', ').toUpperCase() + ') ' : ''
  s += data.revert ? 'Revert "' : ''
  s += data.group ? data.group + ': ' : ''
  s += data.summary
  s += data.revert ? '" ' : ' '
  s += data.author ? '(' + data.author + ') ' : ''
  s += data.pr ? data.prUrl : ''

  return data.semver.length
      ? chalk.green(chalk.bold(s))
      : data.group == 'doc'
        ? chalk.grey(s)
        : s
}


function toStringMarkdown (data) {
  var s = ''
  if(data.isRelease){
    s += '\n## ['+cleanMarkdown(data.summary)+'] - '+ data.authorDate
  } else {
    s += '* [[`' + data.sha.substr(0, 10) + '`](' + data.shaUrl + ')] - '
    s += (data.semver || []).length ? '**(' + data.semver.join(', ').toUpperCase() + ')** ' : ''
    s += data.revert ? '***Revert*** "' : ''
    s += data.group ? '**' + data.group + '**: ' : ''
    s += cleanMarkdown(data.summary)
    s += data.revert ? '" ' : ' '
    s += data.author ? '(' + data.author.trim() + ') ' : ''
    s += data.pr ? '[' + data.pr + '](' + data.prUrl + ')' : ''
  }

  return data.semver.length
      ? chalk.green(chalk.bold(s))
      : data.group == 'doc'
        ? chalk.grey(s)
        : s
}


function commitToOutput (commit, simple, ghId, beautifier) {
  var data        = {};
  var prUrlMatch  = commit.prUrl && commit.prUrl.match(/^https?:\/\/.+\/([^\/]+\/[^\/]+)\/\w+\/\d+$/i);
  var urlHash     = '#'+commit.ghIssue || commit.prUrl;
  var ghUrl       = ghId.user + '/' + ghId.name;
  var authorDate  = commit.authorDate || ''
  
  authorDate      = (authorDate !== '') ? new Date(authorDate) : ''

  data.sha        = commit.sha
  data.shaUrl     = 'https://github.com/' + ghUrl + '/commit/' + commit.sha.substr(0,10)
  data.semver     = commit.labels && commit.labels.filter(function (l) { return l.indexOf('semver') > -1 }) || false
  data.revert     = reverts.isRevert(commit.summary)
  data.group      = groups.toGroups(commit.summary)
  data.summary    = groups.cleanSummary(reverts.cleanSummary(commit.summary))
  data.author     = (commit.author && commit.author.name) || ''
  data.authorDate = (authorDate !== '') ? authorDate.getFullYear() + '-' + authorDate.getMonth() + '-' + authorDate.getDate() : ''
  data.pr         = prUrlMatch && ((prUrlMatch[1] != ghUrl ? prUrlMatch[1] : '') + urlHash)
  data.prUrl      = prUrlMatch && commit.prUrl
  data.isRelease  = (beautifier && groups.isReleaseCommit(commit.summary))

  return (simple ? toStringSimple : toStringMarkdown)(data)
}


module.exports = commitToOutput