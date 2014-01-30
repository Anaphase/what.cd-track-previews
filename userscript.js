// ==UserScript==
// @name         What.cd Track Previews
// @version      1.0.1
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
        , setState = function(open) {
            if (open) {
              $toggle_link.text('(Hide)').data('open', true)
              plugin.$videos_container.show()
            } else {
              $toggle_link.text('(Show)').data('open', false)
              plugin.$videos_container.hide()
            }
          }
      
      setState(GM_getValue('is_open'))
      
      $toggle_link.on('click', function(e){
        var new_state = !$toggle_link.data('open')
        e.preventDefault()
        setState(new_state)
        GM_setValue('is_open', new_state)
      })
      
      $video_table_header_cell.append($toggle_link)
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
      
      if (song_name.toLowerCase().search(plugin.artist_name.toLowerCase()) == -1)
        song_name += ' by ' + plugin.artist_name
      
      $.getJSON(plugin.protocol + '//gdata.youtube.com/feeds/api/videos?v=2&alt=json&orderby=relevance&q=' + song_name, function(data){
        if (!data.feed.entry) {
          $song_link.css({'color': '#ccc', 'text-decoration': 'line-through'}).off('click').on('click', function(e){
            e.preventDefault()
            alert('No YouTube videos wer found for "' + song_name + '"')
          })
          return
        }
        var video_id = data.feed.entry[0].media$group.yt$videoid.$t
        $song_link.data('video_id', video_id)
        $song_link.after('<iframe id="preview_video_' + video_id + '" class="preview_video" style="display: block;" width="100%" height="326" src="' + plugin.protocol + '//www.youtube.com/embed/' + video_id + '?rel=0&autoplay=1" frameborder="0" allowfullscreen></iframe>')
      })
      
    }
    
  }
  
  plugin.injectVideoTable()
  plugin.getSongList()
  
})(jQuery)
