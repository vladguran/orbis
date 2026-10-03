// Orbis – kuratierte Daten. Einwohner in Mio. (ca. 2024), Fläche in km².
// Felder: de, atlasName, iso2, Hauptstadt, Lat, Lon, Einwohner, Fläche, Kontinent
const COUNTRIES_RAW = [
  // Europa
  ["Deutschland","Germany","de","Berlin",52.52,13.40,83.5,357592,"EU"],
  ["Österreich","Austria","at","Wien",48.21,16.37,9.2,83879,"EU"],
  ["Schweiz","Switzerland","ch","Bern",46.95,7.45,8.9,41285,"EU"],
  ["Frankreich","France","fr","Paris",48.86,2.35,68.4,551695,"EU"],
  ["Italien","Italy","it","Rom",41.90,12.50,59.0,301340,"EU"],
  ["Spanien","Spain","es","Madrid",40.42,-3.70,48.6,505990,"EU"],
  ["Portugal","Portugal","pt","Lissabon",38.72,-9.14,10.6,92212,"EU"],
  ["Vereinigtes Königreich","United Kingdom","gb","London",51.51,-0.13,68.3,243610,"EU"],
  ["Irland","Ireland","ie","Dublin",53.35,-6.26,5.3,70273,"EU"],
  ["Niederlande","Netherlands","nl","Amsterdam",52.37,4.90,17.9,41850,"EU"],
  ["Belgien","Belgium","be","Brüssel",50.85,4.35,11.8,30528,"EU"],
  ["Luxemburg","Luxembourg","lu","Luxemburg",49.61,6.13,0.67,2586,"EU"],
  ["Dänemark","Denmark","dk","Kopenhagen",55.68,12.57,6.0,42933,"EU"],
  ["Norwegen","Norway","no","Oslo",59.91,10.75,5.6,385207,"EU"],
  ["Schweden","Sweden","se","Stockholm",59.33,18.07,10.6,450295,"EU"],
  ["Finnland","Finland","fi","Helsinki",60.17,24.94,5.6,338455,"EU"],
  ["Island","Iceland","is","Reykjavík",64.15,-21.94,0.39,103000,"EU"],
  ["Polen","Poland","pl","Warschau",52.23,21.01,36.6,312696,"EU"],
  ["Tschechien","Czechia","cz","Prag",50.08,14.44,10.9,78871,"EU"],
  ["Slowakei","Slovakia","sk","Bratislava",48.15,17.11,5.4,49035,"EU"],
  ["Ungarn","Hungary","hu","Budapest",47.50,19.04,9.6,93030,"EU"],
  ["Slowenien","Slovenia","si","Ljubljana",46.06,14.51,2.1,20271,"EU"],
  ["Kroatien","Croatia","hr","Zagreb",45.81,15.98,3.9,56594,"EU"],
  ["Bosnien und Herzegowina","Bosnia and Herz.","ba","Sarajevo",43.86,18.41,3.2,51197,"EU"],
  ["Serbien","Serbia","rs","Belgrad",44.79,20.45,6.6,77474,"EU"],
  ["Montenegro","Montenegro","me","Podgorica",42.44,19.26,0.62,13812,"EU"],
  ["Albanien","Albania","al","Tirana",41.33,19.82,2.8,28748,"EU"],
  ["Nordmazedonien","Macedonia","mk","Skopje",41.99,21.43,1.8,25713,"EU"],
  ["Griechenland","Greece","gr","Athen",37.98,23.73,10.4,131957,"EU"],
  ["Bulgarien","Bulgaria","bg","Sofia",42.70,23.32,6.4,110994,"EU"],
  ["Rumänien","Romania","ro","Bukarest",44.43,26.10,19.0,238397,"EU"],
  ["Moldau","Moldova","md","Chișinău",47.01,28.86,2.4,33846,"EU"],
  ["Ukraine","Ukraine","ua","Kiew",50.45,30.52,null,603550,"EU"],
  ["Belarus","Belarus","by","Minsk",53.90,27.57,9.2,207600,"EU"],
  ["Litauen","Lithuania","lt","Vilnius",54.69,25.28,2.9,65300,"EU"],
  ["Lettland","Latvia","lv","Riga",56.95,24.11,1.9,64589,"EU"],
  ["Estland","Estonia","ee","Tallinn",59.44,24.75,1.4,45339,"EU"],
  ["Russland","Russia","ru","Moskau",55.76,37.62,144,17098246,"EU"],
  ["Türkei","Turkey","tr","Ankara",39.93,32.86,85.3,783562,"AS"],
  ["Zypern","Cyprus","cy","Nikosia",35.17,33.36,1.3,9251,"EU"],
  ["Malta","Malta","mt","Valletta",35.90,14.51,0.56,316,"EU"],
  // Asien
  ["China","China","cn","Peking",39.90,116.41,1410,9596961,"AS"],
  ["Japan","Japan","jp","Tokio",35.68,139.69,124,377975,"AS"],
  ["Südkorea","South Korea","kr","Seoul",37.57,126.98,51.7,100210,"AS"],
  ["Nordkorea","North Korea","kp","Pjöngjang",39.04,125.76,26,120538,"AS"],
  ["Indien","India","in","Neu-Delhi",28.61,77.21,1430,3287263,"AS"],
  ["Pakistan","Pakistan","pk","Islamabad",33.68,73.05,240,null,"AS"],
  ["Bangladesch","Bangladesh","bd","Dhaka",23.81,90.41,173,148460,"AS"],
  ["Indonesien","Indonesia","id","Jakarta",-6.21,106.85,278,1904569,"AS"],
  ["Thailand","Thailand","th","Bangkok",13.76,100.50,71.7,513120,"AS"],
  ["Vietnam","Vietnam","vn","Hanoi",21.03,105.85,100,331212,"AS"],
  ["Philippinen","Philippines","ph","Manila",14.60,120.98,115,300000,"AS"],
  ["Malaysia","Malaysia","my","Kuala Lumpur",3.14,101.69,34,330803,"AS"],
  ["Mongolei","Mongolia","mn","Ulaanbaatar",47.89,106.91,3.4,1564116,"AS"],
  ["Kasachstan","Kazakhstan","kz","Astana",51.17,71.45,20,2724900,"AS"],
  ["Usbekistan","Uzbekistan","uz","Taschkent",41.30,69.24,36,448978,"AS"],
  ["Iran","Iran","ir","Teheran",35.69,51.39,89,1648195,"AS"],
  ["Saudi-Arabien","Saudi Arabia","sa","Riad",24.71,46.68,33,2149690,"AS"],
  ["Myanmar","Myanmar","mm","Naypyidaw",19.76,96.08,54,676578,"AS"],
  ["Nepal","Nepal","np","Kathmandu",27.72,85.32,30,147181,"AS"],
  // Afrika
  ["Ägypten","Egypt","eg","Kairo",30.04,31.24,112,1001450,"AF"],
  ["Nigeria","Nigeria","ng","Abuja",9.08,7.40,224,923768,"AF"],
  ["Niger","Niger","ne","Niamey",13.51,2.11,27,1267000,"AF"],
  ["Kenia","Kenya","ke","Nairobi",-1.29,36.82,55,580367,"AF"],
  ["Äthiopien","Ethiopia","et","Addis Abeba",9.03,38.74,126,1104300,"AF"],
  ["Marokko","Morocco","ma","Rabat",34.02,-6.84,37,null,"AF"],
  ["Algerien","Algeria","dz","Algier",36.75,3.06,46,2381741,"AF"],
  ["Tunesien","Tunisia","tn","Tunis",36.81,10.18,12.3,163610,"AF"],
  ["Libyen","Libya","ly","Tripolis",32.89,13.19,7,1759540,"AF"],
  ["Ghana","Ghana","gh","Accra",5.60,-0.19,34,238533,"AF"],
  ["Tansania","Tanzania","tz","Dodoma",-6.16,35.75,67,945087,"AF"],
  ["DR Kongo","Dem. Rep. Congo","cd","Kinshasa",-4.44,15.27,102,2344858,"AF"],
  ["Tschad","Chad","td","N’Djamena",12.13,15.06,18,1284000,"AF"],
  ["Madagaskar","Madagascar","mg","Antananarivo",-18.88,47.51,30,587041,"AF"],
  ["Senegal","Senegal","sn","Dakar",14.72,-17.47,18,196722,"AF"],
  ["Côte d’Ivoire","Côte d'Ivoire","ci","Yamoussoukro",6.83,-5.29,29,322463,"AF"],
  ["Angola","Angola","ao","Luanda",-8.84,13.23,37,1246700,"AF"],
  ["Mali","Mali","ml","Bamako",12.64,-8.00,23,1240192,"AF"],
  ["Südafrika","South Africa","za",null,-25.75,28.19,62,1221037,"AF"],
  // Amerika
  ["USA","United States of America","us","Washington, D.C.",38.91,-77.04,335,9833520,"NA"],
  ["Kanada","Canada","ca","Ottawa",45.42,-75.70,40,9984670,"NA"],
  ["Mexiko","Mexico","mx","Mexiko-Stadt",19.43,-99.13,129,1964375,"NA"],
  ["Kuba","Cuba","cu","Havanna",23.11,-82.37,11,109884,"NA"],
  ["Jamaika","Jamaica","jm","Kingston",18.00,-76.79,2.8,10991,"NA"],
  ["Panama","Panama","pa","Panama-Stadt",8.98,-79.52,4.4,75417,"NA"],
  ["Costa Rica","Costa Rica","cr","San José",9.93,-84.08,5.2,51100,"NA"],
  ["Guatemala","Guatemala","gt","Guatemala-Stadt",14.63,-90.51,18,108889,"NA"],
  ["Brasilien","Brazil","br","Brasília",-15.79,-47.88,203,8515767,"SA"],
  ["Argentinien","Argentina","ar","Buenos Aires",-34.60,-58.38,46,2780400,"SA"],
  ["Chile","Chile","cl","Santiago de Chile",-33.45,-70.67,19.6,756102,"SA"],
  ["Peru","Peru","pe","Lima",-12.05,-77.04,34,1285216,"SA"],
  ["Kolumbien","Colombia","co","Bogotá",4.71,-74.07,52,1141748,"SA"],
  ["Venezuela","Venezuela","ve","Caracas",10.48,-66.90,28,916445,"SA"],
  ["Ecuador","Ecuador","ec","Quito",-0.18,-78.47,18,283561,"SA"],
  ["Bolivien","Bolivia","bo",null,-16.50,-68.15,12.4,1098581,"SA"],
  ["Uruguay","Uruguay","uy","Montevideo",-34.90,-56.16,3.4,176215,"SA"],
  ["Paraguay","Paraguay","py","Asunción",-25.26,-57.58,6.9,406752,"SA"],
  // Ozeanien
  ["Australien","Australia","au","Canberra",-35.28,149.13,26.6,7692024,"OC"],
  ["Neuseeland","New Zealand","nz","Wellington",-41.29,174.78,5.2,268021,"OC"],
  ["Papua-Neuguinea","Papua New Guinea","pg","Port Moresby",-9.44,147.18,10,462840,"OC"],
];

// Länder, die nur als Flagge vorkommen (zu klein für die Karte)
const FLAG_ONLY = [["Monaco","mc"],["Liechtenstein","li"],["Andorra","ad"]];

// Flaggen, die leicht verwechselt werden
const FLAG_GROUPS = [
  ["td","ro","md","ad"], ["id","mc","pl"], ["ie","ci","it"], ["nl","lu","fr","ru"],
  ["au","nz","gb"], ["sn","ml","gh"], ["co","ec","ve"], ["si","sk","ru","rs"],
  ["no","is","dk","fi","se"], ["at","lv","pe"], ["cu","pa","cl","us"], ["bg","hu","it"],
  ["ar","uy","gt"], ["ng","ne","ie","ci"], ["at","li","ch","dk"], ["jp","bd","kr"],
  ["dz","ma","tn","ly"], ["sa","pk","dz"], ["cd","td","tz"], ["ee","fi","lt"],
];

// Hauptstadt-Fallen: die richtige Hauptstadt steht in COUNTRIES_RAW, das hier sind gemeine Alternativen
const CAPITAL_TRAPS = {
  au:["Sydney","Melbourne","Perth"], ca:["Toronto","Montreal","Vancouver"],
  tr:["Istanbul","Izmir","Antalya"], ch:["Zürich","Genf","Basel"],
  br:["Rio de Janeiro","São Paulo","Salvador"], ng:["Lagos","Kano","Ibadan"],
  tz:["Daressalam","Arusha","Sansibar-Stadt"], ci:["Abidjan","Bouaké","Dakar"],
  ma:["Casablanca","Marrakesch","Fès"], kz:["Almaty","Schymkent","Taschkent"],
  mm:["Yangon","Mandalay","Bangkok"], vn:["Ho-Chi-Minh-Stadt","Da Nang","Phnom Penh"],
  nz:["Auckland","Christchurch","Queenstown"], us:["New York","Los Angeles","Philadelphia"],
  pk:["Karatschi","Lahore","Rawalpindi"], in:["Mumbai","Kolkata","Bangalore"],
  cn:["Shanghai","Hongkong","Xi’an"], me:["Budva","Kotor","Cetinje"],
  mt:["Mdina","Sliema","Birkirkara"], ec:["Guayaquil","Cuenca","Lima"],
  co:["Medellín","Cali","Cartagena"], si:["Maribor","Bratislava","Zagreb"],
  sk:["Košice","Ljubljana","Budapest"], lt:["Kaunas","Riga","Klaipėda"],
  ph:["Quezon City","Cebu","Davao"], sa:["Dschidda","Mekka","Dubai"],
  ke:["Mombasa","Kampala","Daressalam"], eg:["Alexandria","Gizeh","Luxor"],
  it:["Mailand","Neapel","Florenz"], es:["Barcelona","Valencia","Sevilla"],
  de:["Bonn","Hamburg","München"], ie:["Cork","Belfast","Galway"],
  is:["Akureyri","Tórshavn","Nuuk"], kr:["Busan","Incheon","Pjöngjang"],
};

// Kompass: Was liegt nördlicher/südlicher/östlicher/westlicher?
// [Frage-Richtung, StadtA, latA, lonA, StadtB, latB, lonB, Erklärung]
const COMPASS = [
  ["N","Rom",41.90,12.50,"New York",40.71,-74.01,"Europa liegt viel nördlicher, als es sich anfühlt – der Golfstrom hält es warm."],
  ["N","Madrid",40.42,-3.70,"Peking",39.90,116.41,"Madrid und Peking liegen fast auf demselben Breitengrad – Madrid ein kleines Stück nördlicher."],
  ["N","London",51.51,-0.13,"Calgary",51.05,-114.07,"London liegt nördlicher als Calgary – mitten in den kanadischen Prärien."],
  ["N","Paris",48.86,2.35,"Montreal",45.50,-73.57,"Paris liegt gut 3 Breitengrade nördlicher als Montreal."],
  ["N","Paris",48.86,2.35,"Seattle",47.61,-122.33,"Seattle, die Regenstadt im Nordwesten der USA, liegt südlicher als Paris."],
  ["N","Barcelona",41.39,2.17,"Chicago",41.88,-87.63,"Andersrum gedacht: Chicago liegt sogar ein Stück nördlicher als Barcelona."],
  ["N","Oslo",59.91,10.75,"Anchorage",61.22,-149.90,"Anchorage in Alaska liegt nördlicher als Oslo."],
  ["N","Venedig",45.44,12.32,"Toronto",43.65,-79.38,"Venedig liegt fast 2 Breitengrade nördlicher als Toronto."],
  ["N","Tokio",35.68,139.69,"Athen",37.98,23.73,"Athen liegt nördlicher als Tokio."],
  ["S","Wien",48.21,16.37,"München",48.14,11.58,"München liegt ein kleines Stück südlicher als Wien."],
  ["S","Detroit",42.33,-83.05,"Windsor (Kanada)",42.31,-83.04,"Von Detroit fährt man nach Süden, um nach Kanada zu kommen – Windsor liegt südlicher."],
  ["S","Kairo",30.04,31.24,"Miami",25.76,-80.19,"Miami liegt deutlich südlicher als Kairo."],
  ["W","Reno",39.53,-119.81,"Los Angeles",34.05,-118.24,"Kaliforniens Küste knickt nach Osten ab – Reno in Nevada liegt westlicher als Los Angeles."],
  ["W","Miami",25.76,-80.19,"Santiago de Chile",-33.45,-70.67,"Ganz Südamerika liegt östlicher als man denkt – Miami ist westlicher als Santiago de Chile."],
  ["E","Lima",-12.05,-77.04,"Miami",25.76,-80.19,"Sogar Lima an der Pazifikküste liegt östlicher als Miami."],
  ["E","Wien",48.21,16.37,"Prag",50.08,14.44,"Wien liegt östlicher als Prag – obwohl Prag oft als „Osteuropa“ gilt."],
  ["E","Helsinki",60.17,24.94,"Athen",37.98,23.73,"Helsinki liegt östlicher als Athen."],
  ["W","Lissabon",38.72,-9.14,"Dublin",53.35,-6.26,"Lissabon liegt westlicher als Dublin."],
];

// Höher/Tiefer mit Aha-Effekt: [Metrik, isoA, isoB, Erklärung]
const HIGHER = [
  ["pop","ca","co","Kolumbien hat mehr Einwohner als das riesige Kanada."],
  ["pop","au","gh","Ghana hat mehr Einwohner als ganz Australien."],
  ["pop","ru","bd","Bangladesch – kleiner als Griechenland plus Österreich – hat mehr Einwohner als Russland."],
  ["pop","de","et","Äthiopien hat rund anderthalb mal so viele Einwohner wie Deutschland."],
  ["pop","it","cd","Die DR Kongo hat deutlich mehr Einwohner als Italien."],
  ["pop","es","ke","Kenia hat mehr Einwohner als Spanien."],
  ["pop","jp","mx","Mexiko hat inzwischen mehr Einwohner als Japan."],
  ["area","fr","mg","Madagaskar ist größer als das europäische Frankreich."],
  ["area","gb","nz","Neuseeland ist größer als das Vereinigte Königreich."],
  ["area","de","jp","Japan ist größer als Deutschland."],
  ["area","es","ke","Kenia ist größer als Spanien."],
  ["area","dz","kz","Kasachstan ist sogar größer als Algerien, das größte Land Afrikas."],
  ["area","ly","mn","Libyen ist größer als die Mongolei."],
  ["area","it","nz","Italien ist ein Stück größer als Neuseeland."],
  ["area","au","br","Brasilien ist größer als Australien."],
  ["area","pe","ar","Argentinien ist mehr als doppelt so groß wie Peru."],
];

// Ausreißer: [Frage, Antwort(nicht-Nachbar), [drei echte Nachbarn], Erklärung]
const OUTLIERS = [
  ["Welches Land grenzt NICHT an Deutschland?","Italien",["Luxemburg","Tschechien","Dänemark"],"Zwischen Deutschland und Italien liegen Österreich und die Schweiz."],
  ["Welches Land grenzt NICHT an Österreich?","Kroatien",["Slowenien","Liechtenstein","Slowakei"],"Kroatien ist nah, aber Slowenien und Ungarn liegen dazwischen."],
  ["Welches Land grenzt NICHT an Russland?","Rumänien",["Nordkorea","Norwegen","Mongolei"],"Russland grenzt sogar an Nordkorea – aber nicht an Rumänien."],
  ["Welches Land grenzt NICHT an Brasilien?","Ecuador",["Peru","Kolumbien","Suriname"],"Brasilien grenzt an alle Länder Südamerikas außer Chile und Ecuador."],
  ["Welches Land grenzt NICHT an China?","Thailand",["Afghanistan","Vietnam","Nepal"],"China hat 14 Nachbarn, Thailand gehört nicht dazu – Laos und Myanmar liegen dazwischen."],
  ["Welches Land grenzt NICHT an Spanien?","Italien",["Marokko","Andorra","Vereinigtes Königreich"],"Spanien grenzt über Ceuta und Melilla an Marokko und über Gibraltar an das Vereinigte Königreich."],
  ["Welches Land grenzt NICHT an Frankreich?","Portugal",["Brasilien","Andorra","Monaco"],"Über Französisch-Guayana grenzt Frankreich an Brasilien – an Portugal aber nicht."],
  ["Welches Land grenzt NICHT an die Schweiz?","Slowenien",["Liechtenstein","Österreich","Italien"],"Slowenien liegt hinter Österreich und Italien."],
  ["Welches Land grenzt NICHT an Ungarn?","Tschechien",["Serbien","Ukraine","Slowenien"],"Ungarn hat sieben Nachbarn – Tschechien ist keiner davon."],
  ["Welches Land grenzt NICHT an Polen?","Lettland",["Litauen","Belarus","Russland"],"Polen grenzt über die Exklave Kaliningrad an Russland, aber nicht an Lettland."],
];

// Wissensfragen: [Frage, richtige Antwort, [falsche], Erklärung]
const TRIVIA = [
  ["Welches Land hat die meisten Zeitzonen?","Frankreich",["Russland","USA","China"],"Dank seiner Überseegebiete kommt Frankreich auf 12 Zeitzonen – mehr als jedes andere Land."],
  ["Welcher Fluss fließt durch die meisten Länder?","Donau",["Nil","Rhein","Amazonas"],"Die Donau fließt durch 10 Länder – von Deutschland bis in die Ukraine."],
  ["Welches Land ist von Binnenländern umschlossen – und damit ein doppeltes Binnenland?","Liechtenstein",["Schweiz","Luxemburg","Österreich"],"Es gibt weltweit nur zwei doppelte Binnenländer: Liechtenstein und Usbekistan."],
  ["Mit welchem Land teilt Kanada seit 2022 eine Landgrenze?","Dänemark",["Russland","Island","Norwegen"],"Die Hans-Insel zwischen Grönland und Kanada wurde 2022 geteilt – seitdem grenzen Kanada und Dänemark aneinander."],
  ["Was ist der südlichste Punkt Afrikas?","Kap Agulhas",["Kap der Guten Hoffnung","Kap Hoorn","Kap Verde"],"Nicht das berühmte Kap der Guten Hoffnung, sondern Kap Agulhas, rund 150 km weiter südöstlich."],
  ["Welcher Regierungssitz liegt am höchsten?","La Paz",["Quito","Bogotá","Addis Abeba"],"La Paz in Bolivien liegt auf rund 3.600 Metern."],
  ["Welches Land hat die längste Küstenlinie der Welt?","Kanada",["Indonesien","Russland","Australien"],"Kanadas Küste ist durch die vielen arktischen Inseln mit großem Abstand die längste."],
  ["Welches Land hat mehr Pyramiden als Ägypten?","Sudan",["Mexiko","Peru","Libyen"],"Im Sudan stehen über 200 nubische Pyramiden – mehr als in Ägypten."],
  ["Durch welches Land verlaufen sowohl der Äquator als auch der südliche Wendekreis?","Brasilien",["Australien","Indonesien","Kenia"],"Der Äquator verläuft durch Brasiliens Norden, der Wendekreis des Steinbocks durch den Bundesstaat São Paulo."],
  ["Wie nah kommen sich Russland und die USA an der engsten Stelle?","rund 4 km",["rund 80 km","rund 400 km","rund 1.200 km"],"Zwischen den Diomedes-Inseln in der Beringstraße liegen nur etwa 4 Kilometer."],
  ["Welche Nationalflagge ist als einzige nicht rechteckig?","Nepal",["Schweiz","Bhutan","Vatikanstadt"],"Nepals Flagge besteht aus zwei übereinanderliegenden Dreiecken. Die Schweiz und der Vatikan haben quadratische Flaggen."],
  ["Welcher Kontinent hat die meisten Länder?","Afrika",["Asien","Europa","Südamerika"],"Afrika hat 54 international anerkannte Staaten."],
];

// Schätzen: Luftlinie zwischen zwei Städten
const DISTANCES = [
  ["Lissabon",38.72,-9.14,"Moskau",55.76,37.62],
  ["Berlin",52.52,13.40,"New York",40.71,-74.01],
  ["Wien",48.21,16.37,"Tokio",35.68,139.69],
  ["Frankfurt",50.11,8.68,"Sydney",-33.87,151.21],
  ["Madrid",40.42,-3.70,"Buenos Aires",-34.60,-58.38],
  ["Kairo",30.04,31.24,"Kapstadt",-33.92,18.42],
  ["Paris",48.86,2.35,"Rom",41.90,12.50],
  ["Zürich",47.38,8.54,"Dubai",25.20,55.27],
  ["München",48.14,11.58,"Istanbul",41.01,28.98],
  ["London",51.51,-0.13,"Los Angeles",34.05,-118.24],
  ["Hamburg",53.55,9.99,"Reykjavík",64.15,-21.94],
  ["Wien",48.21,16.37,"Kapstadt",-33.92,18.42],
  ["Oslo",59.91,10.75,"Neapel",40.85,14.27],
  ["Mexiko-Stadt",19.43,-99.13,"Lima",-12.05,-77.04],
  ["Tokio",35.68,139.69,"Singapur",1.35,103.82],
];

// Detektiv: drei Hinweise, vom schwersten zum leichtesten
const DETECTIVE = [
  {a:"Irland",clues:["Hier herrscht Linksverkehr.","Das Land grenzt an genau ein anderes Land.","Die Flagge ist grün-weiß-orange."],opts:["Irland","Côte d’Ivoire","Malta","Zypern","Italien","Indien"]},
  {a:"Chile",clues:["Das Land ist über 4.000 km lang, aber im Schnitt nur rund 180 km breit.","Hier liegt eine der trockensten Wüsten der Erde.","Die Osterinsel gehört dazu."],opts:["Chile","Peru","Argentinien","Norwegen","Vietnam","Ecuador"]},
  {a:"Mongolei",clues:["Ein Binnenland mit genau zwei Nachbarn.","Kein unabhängiger Staat ist dünner besiedelt.","Die Hauptstadt gilt als kälteste Hauptstadt der Welt."],opts:["Mongolei","Nepal","Bhutan","Kasachstan","Laos","Kirgisistan"]},
  {a:"Bolivien",clues:["Ein Binnenland in Südamerika.","Trotz fehlender Küste unterhält es eine Marine.","Hier liegt die größte Salzpfanne der Erde."],opts:["Bolivien","Paraguay","Peru","Chile","Ecuador","Uruguay"]},
  {a:"Indonesien",clues:["Das Land besteht aus mehr als 17.000 Inseln.","Es ist das bevölkerungsreichste Land mit muslimischer Mehrheit.","Die Flagge ist rot-weiß – fast identisch mit der von Monaco."],opts:["Indonesien","Philippinen","Malaysia","Japan","Polen","Monaco"]},
  {a:"Kanada",clues:["Das Land hat die längste Küstenlinie der Welt.","Es besitzt mehr Seen als jedes andere Land.","Seit 2022 teilt es eine Landgrenze mit Dänemark."],opts:["Kanada","Russland","Norwegen","Finnland","USA","Island"]},
  {a:"Slowenien",clues:["Das Land hat nur knapp 50 km Küste.","Es grenzt an Italien, Österreich, Ungarn und Kroatien.","Die Hauptstadt heißt Ljubljana."],opts:["Slowenien","Slowakei","Kroatien","Montenegro","Bosnien und Herzegowina","Albanien"]},
  {a:"Nepal",clues:["Ein Binnenland mit genau zwei Nachbarn.","Acht der vierzehn Achttausender stehen hier ganz oder teilweise.","Die Flagge ist als einzige nicht rechteckig."],opts:["Nepal","Bhutan","Mongolei","Pakistan","Laos","Kirgisistan"]},
  {a:"Island",clues:["Das Land liegt auf dem Mittelatlantischen Rücken.","Es hat keine eigene Armee.","Seine Hauptstadt ist die nördlichste eines unabhängigen Staates."],opts:["Island","Norwegen","Irland","Finnland","Dänemark","Neuseeland"]},
  {a:"Kasachstan",clues:["Es ist das größte Binnenland der Welt.","Von hier startete Juri Gagarin ins All.","Die Hauptstadt heißt Astana."],opts:["Kasachstan","Mongolei","Usbekistan","Russland","Turkmenistan","Kirgisistan"]},
  {a:"Schweiz",clues:["Hier gibt es vier Landessprachen.","Das Land grenzt an Liechtenstein.","Die Flagge ist quadratisch."],opts:["Schweiz","Österreich","Liechtenstein","Belgien","Luxemburg","Vatikanstadt"]},
  {a:"Malta",clues:["Ein EU-Land mit Linksverkehr.","Es ist der kleinste EU-Staat nach Fläche.","Die Hauptstadt heißt Valletta."],opts:["Malta","Zypern","Irland","Luxemburg","Monaco","San Marino"]},
  {a:"Äthiopien",clues:["Das Land wurde – bis auf eine kurze Besetzung – nie kolonisiert.","Sein eigener Kalender liegt rund 7 bis 8 Jahre hinter unserem.","Seit 1993 hat es keinen Zugang mehr zum Meer."],opts:["Äthiopien","Eritrea","Kenia","Somalia","Sudan","Liberia"]},
  {a:"Neuseeland",clues:["Hier leben deutlich mehr Schafe als Menschen.","Die Hauptstadt ist die südlichste eines unabhängigen Staates.","Frauen durften hier schon 1893 landesweit wählen."],opts:["Neuseeland","Australien","Irland","Chile","Argentinien","Norwegen"]},
  {a:"Brasilien",clues:["Das Land grenzt an zehn Staaten.","Äquator und südlicher Wendekreis verlaufen beide hindurch.","Amtssprache ist Portugiesisch."],opts:["Brasilien","Kolumbien","Argentinien","Peru","Angola","Mosambik"]},
];

// ---------- Erweiterung v2 ----------
COMPASS.push(
  ["N","Edinburgh",55.95,-3.19,"Moskau",55.76,37.62,"Edinburgh liegt tatsächlich ein kleines Stück nördlicher als Moskau."],
  ["N","Berlin",52.52,13.40,"London",51.51,-0.13,"Berlin liegt rund einen Breitengrad nördlicher als London."],
  ["S","Rom",41.90,12.50,"Barcelona",41.39,2.17,"Barcelona liegt südlicher als Rom."],
  ["W","Venedig",45.44,12.32,"Salzburg",47.81,13.04,"Venedig liegt westlicher als Salzburg."],
  ["W","Edinburgh",55.95,-3.19,"Bristol",51.45,-2.59,"Großbritannien ist schräg – Edinburgh liegt westlicher als Bristol."],
  ["N","Neapel",40.85,14.27,"Peking",39.90,116.41,"Neapel liegt fast einen Breitengrad nördlicher als Peking."],
  ["E","Panama-Stadt (Pazifik)",8.98,-79.52,"Colón (Atlantik)",9.36,-79.90,"Der Panamakanal verläuft schräg: Sein Pazifik-Ende liegt östlicher als sein Atlantik-Ende."],
  ["E","Kiew",50.45,30.52,"Istanbul",41.01,28.98,"Kiew liegt östlicher als Istanbul."]
);
HIGHER.push(
  ["pop","br","pk","Pakistan hat mehr Einwohner als Brasilien."],
  ["pop","de","eg","Ägypten hat deutlich mehr Einwohner als Deutschland."],
  ["pop","de","vn","Vietnam hat mehr Einwohner als Deutschland."],
  ["area","mx","sa","Saudi-Arabien ist größer als Mexiko."],
  ["area","it","pl","Polen ist ein Stück größer als Italien."],
  ["area","ro","gb","Das Vereinigte Königreich ist nur knapp größer als Rumänien."]
);
OUTLIERS.push(
  ["Welches Land grenzt NICHT an Italien?","Kroatien",["Slowenien","San Marino","Frankreich"],"Italien und Kroatien trennt die Adria – an Land liegt Slowenien dazwischen."],
  ["Welches Land grenzt NICHT an Tschechien?","Ungarn",["Deutschland","Polen","Slowakei"],"Zwischen Tschechien und Ungarn liegt die Slowakei."],
  ["Welches Land grenzt NICHT an Argentinien?","Peru",["Chile","Bolivien","Uruguay"],"Peru ist durch Bolivien und Chile von Argentinien getrennt."],
  ["Welches Land grenzt NICHT an Indien?","Thailand",["Bhutan","Myanmar","Bangladesch"],"Zwischen Indien und Thailand liegt Myanmar."],
  ["Welches Land grenzt NICHT an Kroatien?","Österreich",["Slowenien","Ungarn","Montenegro"],"Österreich ist nah, aber Slowenien und Ungarn liegen dazwischen."],
  ["Welches Land grenzt NICHT an die Türkei?","Libanon",["Aserbaidschan","Irak","Georgien"],"Die Türkei grenzt über die Exklave Nachitschewan sogar an Aserbaidschan – an den Libanon aber nicht."]
);
TRIVIA.push(
  ["Welches ist das kleinste Land der Welt?","Vatikanstadt",["Monaco","San Marino","Liechtenstein"],"Die Vatikanstadt ist nur rund 0,44 km² groß."],
  ["An wie viele Länder grenzt Österreich?","8",["6","7","9"],"Deutschland, Tschechien, Slowakei, Ungarn, Slowenien, Italien, Schweiz und Liechtenstein."],
  ["Welcher ist der längste Fluss Europas?","Wolga",["Donau","Rhein","Dnepr"],"Die Wolga ist rund 3.500 km lang – deutlich länger als die Donau."],
  ["Welcher ist der größte See der Erde?","Kaspisches Meer",["Oberer See","Baikalsee","Victoriasee"],"Das Kaspische Meer ist trotz seines Namens ein See – und mit Abstand der größte."],
  ["Welcher ist der tiefste See der Erde?","Baikalsee",["Tanganjikasee","Kaspisches Meer","Titicacasee"],"Der Baikalsee in Sibirien ist über 1.600 Meter tief."],
  ["Welches Land hat die meisten Einwohner Afrikas?","Nigeria",["Äthiopien","Ägypten","DR Kongo"],"Nigeria hat über 200 Millionen Einwohner."],
  ["Welche dieser Hauptstädte liegt am nördlichsten?","Reykjavík",["Helsinki","Oslo","Tallinn"],"Reykjavík ist die nördlichste Hauptstadt eines unabhängigen Staates."],
  ["Über wie viele Zeitzonen erstreckt sich Russland?","11",["7","9","13"],"Von Kaliningrad bis Kamtschatka sind es 11 Zeitzonen."],
  ["Welche Millionenstadt liegt auf zwei Kontinenten?","Istanbul",["Kairo","Moskau","Athen"],"Der Bosporus teilt Istanbul in einen europäischen und einen asiatischen Teil."],
  ["Welches Land hat die meisten Inseln?","Schweden",["Norwegen","Finnland","Indonesien"],"Schweden zählt über 260.000 Inseln – die meisten davon winzig."]
);
DETECTIVE.push(
  {a:"Japan",clues:["Hier herrscht Linksverkehr.","Das Land besteht aus über 14.000 Inseln.","Der höchste Berg ist ein Vulkan, der zuletzt 1707 ausbrach."],opts:["Japan","Indonesien","Neuseeland","Philippinen","Südkorea","Taiwan"]},
  {a:"Portugal",clues:["Das Land grenzt an genau ein anderes Land.","Hier liegt der westlichste Punkt des europäischen Festlands.","Die Azoren und Madeira gehören dazu."],opts:["Portugal","Spanien","Irland","Dänemark","Marokko","Norwegen"]},
  {a:"Ägypten",clues:["Das Land liegt auf zwei Kontinenten.","Fast die ganze Bevölkerung lebt entlang eines einzigen Flusses.","Hier liegt der Suezkanal."],opts:["Ägypten","Türkei","Russland","Sudan","Jordanien","Kasachstan"]},
  {a:"Australien",clues:["Hier herrscht Linksverkehr.","Die Hauptstadt wurde neu gebaut, weil sich zwei Großstädte nicht einigen konnten.","Der Uluru liegt hier."],opts:["Australien","Neuseeland","Südafrika","Indien","Brasilien","Kanada"]},
  {a:"Italien",clues:["Das Land umschließt zwei andere Staaten vollständig.","Hier steht der höchste aktive Vulkan Europas.","Die Hauptstadt ist Rom."],opts:["Italien","Südafrika","Frankreich","Griechenland","Spanien","Schweiz"]},
  {a:"Norwegen",clues:["Hier geht im Sommer an manchen Orten wochenlang die Sonne nicht unter.","Spitzbergen gehört dazu.","Die Hauptstadt ist Oslo."],opts:["Norwegen","Schweden","Finnland","Island","Dänemark","Russland"]},
  {a:"Peru",clues:["Hier entspringt der Amazonas.","Der Titicacasee liegt zur Hälfte in diesem Land.","Machu Picchu liegt hier."],opts:["Peru","Bolivien","Kolumbien","Ecuador","Brasilien","Chile"]},
  {a:"Indien",clues:["Hier herrscht Linksverkehr.","Der Ganges fließt durch dieses Land.","Kein Land hat mehr Einwohner."],opts:["Indien","Bangladesch","Pakistan","China","Indonesien","Nepal"]},
  {a:"Kuba",clues:["Es ist die größte Insel der Karibik.","Bis zu den USA sind es nur rund 150 km.","Die Hauptstadt ist Havanna."],opts:["Kuba","Jamaika","Haiti","Dominikanische Republik","Bahamas","Trinidad und Tobago"]},
  {a:"Madagaskar",clues:["Es ist die viertgrößte Insel der Erde.","Rund 90 % der Tier- und Pflanzenarten gibt es nur hier.","Hier leben die Lemuren."],opts:["Madagaskar","Sri Lanka","Indonesien","Mauritius","Neuseeland","Philippinen"]},
  {a:"Niederlande",clues:["Rund ein Viertel des Landes liegt unter dem Meeresspiegel.","Es gibt hier mehr Fahrräder als Einwohner.","Der Regierungssitz ist nicht die Hauptstadt."],opts:["Niederlande","Belgien","Dänemark","Deutschland","Bolivien","Luxemburg"]}
);
