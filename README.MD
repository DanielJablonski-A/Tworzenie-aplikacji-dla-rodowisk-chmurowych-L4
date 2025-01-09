Tworzenie aplikacji dla środowisk chmurowych L4  

Kontenery, komunikacja:  
php <=> mysql <=> vue <=> rabbitmq <=> nodejs  

Po pobraniu repozytorium z docker należy zbudować zależności dla każdego kontenera.  
W tym celu należy w każdym poniżej katlaogu wejśc w terminal i wpisać:  
nodejs: npm install
vue: npm install
php: composer install

Obrazy mysql i rabbitMq nie wymagają dodatkowych zależności działają w tym przypadku 'out of the box'.
Gdy kontenery są gotowe w katalogu głównym w terminalu, w zależności od dockera jaki mamy zainstalowany,
uruchamiamy komendę:  
docker compose build -albo- docker-compose build   
docker compose up -albo- docker-compose up  

Ktora zbuduje nam wszystkie kontenery z pliku docker-compose.yaml

Gdy juz wszystkie kontenery wystartują wchodzimy w przeglądarkę pod adres:  
http://localhost:8080/  
gdzie powinniśmy zobaczyć działający kontener vue.

-----------------------------

Gdy wszystko działa na upartego mozemy chcieć wejśc w każdy kontener:  
docker ps  
Następnie gdy komenda zwróci nam nazwy, komenda do wejścia w kontener:
docker exec -it NAZWAKONTENERA bash

