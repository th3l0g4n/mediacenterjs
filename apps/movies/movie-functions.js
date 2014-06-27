/*
    MediaCenterJS - A NodeJS based mediacenter solution

    Copyright (C) 2014 - Jan Smolders

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/* Global Imports */
var fs = require('fs.extra')
    , file_utils = require('../../lib/utils/file-utils')
    , app_cache_handler = require('../../lib/handlers/app-cache-handler')
    , colors = require('colors')
    , metafetcher = require('../../lib/utils/metadata-fetcher')
    , config = require('../../lib/handlers/configuration-handler').getConfiguration();

var database = require('../../lib/utils/database-connection');
var db = database.openDatabase('movies');

exports.loadItems = function (req, res, serveToFrontEnd){
    var metaType = "movie";
    var getNewFiles = true;

    if(serveToFrontEnd === false){
        fetchMovieData(req, res, metaType, serveToFrontEnd);
    } else if(serveToFrontEnd === undefined || serveToFrontEnd === null){
        var serveToFrontEnd = true;
        getMovies(req, res, metaType, serveToFrontEnd,getNewFiles);
    } else{
        serveToFrontEnd = true;
        getMovies(req, res, metaType, serveToFrontEnd,getNewFiles);
    }
};


exports.backdrops = function (req, res){
    db.find({}).sort({ title: 1 }).exec(function (err, rows) {
        if (!err && rows){
            var backdropArray = [];
            rows.forEach(function(item){
               var backdrop = item.backdrop_path;
               backdropArray.push(backdrop)
            });
            res.json(backdropArray);
        } else {
            console.log(err);
        }
    });
};

exports.edit = function(req, res, data){
    db.update(
        { original_name: data.currentMovie },
        { $set: { title: data.newTitle, poster_path: data.newPosterPath, backdrop_path: data.newBackdropPath } },
        function (err, rows) {
            if(err){
                console.log('DB error', err);
            } else {
                res.json('done');
            }
        }
    );
}



exports.playMovie = function (req, res, platform, movieTitle){
    file_utils.getLocalFile(config.moviepath, movieTitle, function(err, file) {
        if (err){
            console.log('File not found',err .red);
        }
        if (file) {
            var movieUrl = file.href
            , movie_playback_handler = require('./movie-playback-handler');

            var subtitleUrl = movieUrl;
            subtitleUrl = subtitleUrl.split(".");
            subtitleUrl = subtitleUrl[0]+".srt";

            var subtitleTitle = movieTitle;
            subtitleTitle = subtitleTitle.split(".");
            subtitleTitle = subtitleTitle[0]+".srt";

            movie_playback_handler.startPlayback(res, platform, movieUrl, movieTitle, subtitleUrl, subtitleTitle);

        } else {
            console.log("File " + movieTitle + " could not be found!" .red);
        }
    });
};


exports.sendState = function (req, res){
    var incommingData = req.body,
        transcodingstatus = 'pending';

    if(incommingData.movieTitle && incommingData.progression){
        db.update(
            { title: incommingData.movieTitle },
            { $set: { progression: incommingData.currentTime, transcodingStatus: transcodingstatus } });
    }

}


/** Private functions **/

fetchMovieData = function(req, res, metaType, serveToFrontEnd, getNewFiles) {
    console.log('Fetching movie data...');
    metafetcher.fetch(req, res, metaType, function(type){
        if(type === metaType){
            getNewFiles = false;
            console.log('Scraping done');
            getMovies(req, res, metaType, serveToFrontEnd);
        }
    });
}

getMovies = function(req, res, metaType, serveToFrontEnd,getNewFiles){
    console.log('Loading movie data...', serveToFrontEnd);
    db.find({}).sort({ title: 1 }).exec(function (err, rows) {
        console.log(rows);
        if(err){
            console.log("DB error",err);
            serveToFrontEnd = true;
            if(getNewFiles === true){
                fetchMovieData(req, res, metaType, serveToFrontEnd,getNewFiles);
            }
        } else if (rows && serveToFrontEnd !== false && rows.length > 0){
            console.log('Sending data to client...');
            res.json(rows);
        } else {
            console.log('Getting data...');
            serveToFrontEnd = true;

            if(getNewFiles === true){
                fetchMovieData(req, res, metaType, serveToFrontEnd,getNewFiles);
            }
        }
    });
}
