#!/usr/bin/env python3
import yt_dlp
import json
import sys
import os
from datetime import timedelta

def format_duration(seconds):
    """Formata duração em segundos para MM:SS ou HH:MM:SS"""
    if seconds is None:
        return "Duração desconhecida"
    
    td = timedelta(seconds=int(seconds))
    hours = td.seconds // 3600
    minutes = (td.seconds % 3600) // 60
    seconds = td.seconds % 60
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes}:{seconds:02d}"

def format_views(views):
    """Formata número de views"""
    if views is None:
        return "Views desconhecidas"
    
    if views >= 1_000_000:
        return f"{views / 1_000_000:.1f}M"
    elif views >= 1_000:
        return f"{views / 1_000:.1f}K"
    else:
        return str(views)

def search_youtube(query):
    """Busca vídeos no YouTube e retorna informações do primeiro resultado"""
    
    # Caminho para o arquivo de cookies
    cookies_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'get-cookies.txt')
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'format': 'bestvideo[height<=720]+bestaudio/best[height<=720]/best',
        'extract_flat': False,
        'default_search': 'ytsearch1:',
        'writethumbnail': True,
        'writeinfojson': False,
    }
    
    # Adiciona cookies se o arquivo existir
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
        print(f"Usando cookies: {cookies_path}", file=sys.stderr)
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Busca o vídeo
            search_results = ydl.extract_info(f"ytsearch1:{query}", download=False)
            
            if not search_results or 'entries' not in search_results or not search_results['entries']:
                return {"error": "Nenhum resultado encontrado"}
            
            video = search_results['entries'][0]
            
            # Extrai informações detalhadas
            video_info = ydl.extract_info(video['url'], download=False)
            
            # Baixa a thumbnail
            thumbnail_url = video_info.get('thumbnail')
            thumbnail_path = None
            
            if thumbnail_url:
                try:
                    import requests
                    response = requests.get(thumbnail_url)
                    if response.status_code == 200:
                        thumbnail_path = f"temp_thumbnail_{video_info['id']}.jpg"
                        with open(thumbnail_path, 'wb') as f:
                            f.write(response.content)
                except:
                    pass
            
            result = {
                "success": True,
                "id": video_info.get('id'),
                "title": video_info.get('title', 'Título desconhecido'),
                "duration": format_duration(video_info.get('duration')),
                "duration_seconds": video_info.get('duration'),
                "views": format_views(video_info.get('view_count')),
                "uploader": video_info.get('uploader', 'Canal desconhecido'),
                "url": video_info.get('webpage_url'),
                "thumbnail": thumbnail_path,
                "formats": {
                    "audio": video_info.get('formats', []),
                    "video": video_info.get('formats', [])
                }
            }
            
            return result
            
    except Exception as e:
        return {"error": f"Erro na busca: {str(e)}"}

def download_media(url, format_type, output_path="downloads"):
    """Baixa mídia (áudio ou vídeo)"""
    
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    
    # Caminho para o arquivo de cookies
    cookies_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'get-cookie.txt')
    
    if format_type == "audio":
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'{output_path}/%(title)s.%(ext)s',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'quiet': True,
            'no_warnings': True,
        }
    else:  # video
        ydl_opts = {
            'format': 'best[height<=720]/best',
            'outtmpl': f'{output_path}/%(title)s.%(ext)s',
            'quiet': True,
            'no_warnings': True,
        }
    
    # Adiciona cookies se o arquivo existir
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
        print(f"Usando cookies para download: {cookies_path}", file=sys.stderr)
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extrai informações para pegar o nome do arquivo
            info = ydl.extract_info(url, download=False)
            
            # Baixa o arquivo
            ydl.download([url])
            
            # Retorna o caminho do arquivo baixado
            title = info.get('title', 'download')
            
            if format_type == "audio":
                filename = f"{title}.mp3"
            else:
                ext = info.get('ext', 'mp4')
                filename = f"{title}.{ext}"
            
            filepath = os.path.join(output_path, filename)
            
            return {
                "success": True,
                "filepath": filepath,
                "filename": filename,
                "title": title
            }
            
    except Exception as e:
        return {"error": f"Erro no download: {str(e)}"}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Argumentos insuficientes"}))
        return
    
    action = sys.argv[1]
    
    if action == "search":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Query de busca não fornecida"}))
            return
        
        query = " ".join(sys.argv[2:])
        result = search_youtube(query)
        print(json.dumps(result, ensure_ascii=False))
        
    elif action == "download":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "URL e tipo não fornecidos"}))
            return
        
        url = sys.argv[2]
        format_type = sys.argv[3]  # "audio" ou "video"
        
        result = download_media(url, format_type)
        print(json.dumps(result, ensure_ascii=False))
    
    else:
        print(json.dumps({"error": "Ação inválida"}))

if __name__ == "__main__":
    main()
