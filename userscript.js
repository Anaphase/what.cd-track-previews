// ==UserScript==
// @name         What.cd Track Previews
// @version      1.1.0
// @description  Adds a tracklist to album pages. When a track name is clicked, a YouTube video of the song will play.
// @match        http://what.cd/torrents.php*
// @match        https://what.cd/torrents.php*
// @match        https://ssl.what.cd/torrents.php*
// @grant        GM_getValue
// @grant        GM_setValue
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

;(function($){
  
  var plugin = {
    
    protocol: window.location.protocol
    
  , artist_name: $('h2 a').text()
  , song_list: []
  , video_number: 0
    
  , $videos_table: $('<table/>', { 'id': 'videos_table' })
  , $videos_container: $('<tbody/>', { 'id': 'videos_container' })
    
  , options: null
    
  , injectVideoTable: function(){
      
      var $video_table_header = $('<thead/>')
        , $video_table_header_row = $('<tr/>', { 'class': 'colhead' })
        , $video_table_header_cell = $('<td/>', { 'width': '85%' }).html('<a href="#">↑</a>&nbsp;Preview Tracks&nbsp;')
          
        , $toggle_link = $('<a/>').attr('href', '#')
        , setToggleState = function(open) {
            if (open) {
              $toggle_link.text('(Hide)')
              plugin.$videos_container.show()
            } else {
              $toggle_link.text('(Show)')
              plugin.$videos_container.hide()
            }
            GM_setValue('is_open', open)
          }
          
        , $mode_link = $('<a/>').attr('href', '#').css('float', 'right')
        , setMode = function(mode) {
            if (mode == 'video') {
              $mode_link.text('(Switch to Audio Mode)')
              $('.preview_video').css('height', '326px')
            } else {
              $mode_link.text('(Switch to Video Mode)')
              $('.preview_video').css('height', '35px')
            }
            GM_setValue('mode', mode)
          }
      
      setToggleState(GM_getValue('is_open'))
      setMode(GM_getValue('mode'))
      
      $toggle_link.on('click', function(e){
        var new_state = !GM_getValue('is_open')
        e.preventDefault()
        setToggleState(new_state)
      })
      
      $mode_link.on('click', function(e){
        var new_state = GM_getValue('mode') == 'video' ? 'audio' : 'video'
        e.preventDefault()
        setMode(new_state)
      })
      
      $video_table_header_cell.append($toggle_link)
      $video_table_header_cell.append($mode_link)
      $video_table_header_row.html($video_table_header_cell)
      $video_table_header.html($video_table_header_row)
      
      plugin.$videos_table.html($video_table_header)
      plugin.$videos_table.append(plugin.$videos_container)
      
      $('#torrent_details').after(plugin.$videos_table)
      
    }
    
  , getSongList: function(){
      
      $('.filelist_table:first tr:gt(0)').each(function(){
        
        var song = $(this).find('td:first').text()
          , song_name = (/\(?\d+[\.-:]?\)? *-?(.+)\..*$/i).exec(song)
        
        if (song_name) {
          song_name = song_name[1].replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '')
          plugin.song_list.push(song_name)
          plugin.video_number++
          
          var $song_row = $('<tr/>')
            , $song_cell = $('<td/>').html(plugin.video_number + ' - ')
            , $song_link = $('<a/>', { href: '#' }).html(song_name)
          
          $song_link.on('click', function(e){
            
            var $preview_videos = null
            
            e.preventDefault()
            
            if ($song_link.data('video_id')) {
              $('#preview_video_' + $song_link.data('video_id')).slideUp(function(){
                $(this).remove()
              })
              $song_link.data('video_id', null)
              return
            }
            
            $preview_videos = $('.preview_video')
            
            if ($preview_videos.length) {
              $preview_videos.slideUp(function(){
                $(this).remove()
                plugin.getSong($song_link)
              })
            } else {
              plugin.getSong($song_link)
            }
            
          })
          
          plugin.$videos_container.append($song_row.html($song_cell.append($song_link)))
        }
        
      })
      
    }
    
  , getSong: function($song_link){
      
      var song_name = $song_link.text()
        , getIframe = null
      
      if (GM_getValue('mode') == 'video') {
        
        getIframe = function(video_id){
          return '<iframe id="preview_video_' + video_id + '" class="preview_video" style="display: block; margin-top: 5px; width: 580px; height: 326px; border: none;" src="' + plugin.protocol + '//www.youtube.com/embed/' + video_id + '?color=white&theme=dark&rel=0&autoplay=1&autohide=0&iv_load_policy=3" allowfullscreen></iframe>'
        }
        
      } else {
        
        getIframe = function(video_id){
          return '<iframe id="preview_video_' + video_id + '" class="preview_video" style="display: block; margin-top: 5px; width: 580px; height: 35px; border: none;" src="' + plugin.protocol + '//www.youtube.com/embed/' + video_id + '?color=white&theme=dark&rel=0&autoplay=1&autohide=0&iv_load_policy=3" allowfullscreen></iframe>'
        }
        
      }
      
      if (song_name.toLowerCase().search(plugin.artist_name.toLowerCase()) == -1)
        song_name += ' by ' + plugin.artist_name
      
      $.getJSON(plugin.protocol + '//gdata.youtube.com/feeds/api/videos?v=2&alt=json&orderby=relevance&q=' + song_name, function(data){
        
        var video_id = null
        
        if (!data.feed.entry) {
          $song_link.css({'color': '#ccc', 'text-decoration': 'line-through'}).off('click').on('click', function(e){
            e.preventDefault()
            alert('No YouTube videos were found for "' + song_name + '"')
          })
          return
        }
        
        video_id = data.feed.entry[0].media$group.yt$videoid.$t
        
        $song_link.data('video_id', video_id)
        $song_link.after(getIframe(video_id))
        
      })
      
    }
    
  }
  
  plugin.injectVideoTable()
  plugin.getSongList()
  
})(jQuery)
