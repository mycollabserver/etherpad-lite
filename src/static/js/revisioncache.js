/**
 * This code is mostly from the old Etherpad. Please help us to comment this code.
 * This helps other people to understand this code better and helps them to improve it.
 * TL;DR COMMENTS ON THIS FILE ARE HIGHLY APPRECIATED
 */

/**
 * Copyright 2009 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// revision info is a skip list whos entries represent a particular revision
// of the document.  These revisions are connected together by various
// changesets,  or deltas, between any two revisions.

require('./jquery.class');

$.Class("Changeset",
  {//statics
  },
  {//instance
    init: function (deltarev, deltatime, value) {
      this.deltarev = deltarev;
      this.deltatime = deltatime;
      this.value = value;
    },
    getValue: function () {
      return this.value;
    },
  }
);

$.Class("DirectionalIterator",
  {//statics
  },
  {//instance
    init: function (list, direction) {
      self.list = list;
      self.direction = direction;
      self.current = self.direction ? self.list.length - 1 : 0;
    },
    haveNext: function () {
      if ((self.direction && self.current > 0)
        || (!self.direction && self.current < self.list.length))
        return true;
      return false;
    },
    next: function () {
      if (self.direction && self.current > 0)
        return self.list[self.current--];
      if (!self.direction && self.current < self.list.length)
        return self.list[self.current++];

      return undefined;
    }
  }
);

$.Class("Revision",
  {//statics
  },
  {//instance
    init: function (revnum) {
      this.revnum = revnum;
      this.changesets = [];
    },
    addChangeset: function (destindex, changeset, timedelta) {
      this.changesets.push(new Changeset(destindex - this.revnum, timedelta, changeset));
      this.changesets.sort(function (a, b) {
        return (b.deltarev - a.deltarev);
      });
    },
    lt: function (other, is_reverse) {
      if (is_reverse)
        return this.gt(other);
      return this.revnum < other.revnum;
    },
    gt: function (other, is_reverse) {
      if (is_reverse)
        return this.lt(other);
      return this.revnum > other.revnum;
    }
  }
);

$.Class("RevisionCache",
  {
  },
  {//instance
    init: function (head_revnum) {
      this.revisions = {};
      this.head_revnum = head_revnum || 0;
    },
    getRevision: function (revnum) {
      if (revnum in this.revisions)
        return this.revisions[revnum];
      this.revisions[revnum] = new Revision(revnum);
      this.head_revnum = Math.max(this.head_revnum, revnum);
      return this.revisions[revnum];
    },
    findPath: function (from, to) {
      var current_rev = this.getRevision(from);
      var to_rev = this.getRevision(to);
      var is_reverse = !(from < to);
      var changesets = [];

      if (from == to) {
        //TODO: implement short-circuit
      }

      if (!current_rev.changesets.length) {
        // You cannot build a path if the starting revision hasn't
        // got any changesets
        //TODO: implement short-circuit
      }

      while (current_rev.lt(to_rev)) {
        for (var i = 0; i < current_rev.changesets.length; i++) {
          // we might get stuck on a particular revision if only a
          // partial path is available.
          old_rev = current_rev;
          // the next (first) changeset in the current revision has a delta
          // in the opposite direction to that in which we are trying to
          // move, and so cannot help us. Because the changeset list is
          // sorted, we can just stop here.
          if (current_rev.changesets[i].deltarev < 0) {
            // When can this happen?
            stop = true;
          }

          // the current revision has a changeset which helps us get to a revision
          // which is closer to our target, so we should push that changeset to
          // the list and move to that new revision to continue building a path
          if (current_rev.revnum + current_rev.changesets[i].deltarev <= to) {
            changesets.push(current_rev.changesets[i]);
            current_rev = this.getRevision(current_rev.rev + current_rev.changesets[i].deltarev);
            break;
          }
        }
        if (stop || current_rev == old_rev)
          break;
      }

      var status = 'partial';
      if (current_rev == to_rev)
        status = 'complete';

      return {
        'fromRev': from,
        'rev': current_rev.rev,
        'status': status,
        'changesets': changesets,
        /*'spans': spans,
        'times': times
        */
      };
    },
    addChangeset: function (from, to, value, reverseValue, timedelta) {
      var from_rev = this.getRevision(from);
      var to_rev = this.getRevision(to);
      from_rev.addChangeset(to, value, timedelta);
      to_rev.addChangeset(from, reverseValue, -timedelta);
    }
  }
);
function loadBroadcastRevisionsJS(clientVars)
{

  revisionCache = new RevisionCache(clientVars.collab_client_vars.rev || 0);
  revisionInfo.latest = clientVars.collab_client_vars.rev || -1;


}

exports.loadBroadcastRevisionsJS = loadBroadcastRevisionsJS;