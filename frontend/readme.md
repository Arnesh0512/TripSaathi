npx create-expo/create-expo-app  . --template blank --yes
-> create a empty expo directory in root (.)
npx create-expo/create-expo-app  <folder_name>
-> create folder with <folder_name> in current directory as react native app






npx expo install react-dom react-native-web @expo/metro-runtime
-> npx execute expo install 
-> using expo it installs "react-dom", "react-native-web", "@expo/metro-runtime"

npm install --save-dev @expo/ngrok@^4.1.0
-> install ngrok of expo

npm install -g eas-cli
-> install eas(Expo Application Servies)
-> -g globally
-> EAS halps in making APK in cloud without android studio







npx expo export -p web --output-dir temp-export-check (build for web)
npx expo export -p android --output-dir temp-android-check(build for android)
-> used for making build files
-> checking if build is successful
-> web commands gives so that it can hosted as html,css,js for web deployement
-> android command is not generally used as it does not apk 








npm run tunnel/web/android 
-> start server
-> on scanning qr , expo app gets bundle from PC 
-> tunnel mode if phone, pc on different network 
-> press r to reload 








npx expo login
-> login on expo 
-> for expo go

npx eas login
-> login on eas
-> for apk building 










https://auth.expo.io/@<Expo-username>/<project-slug>
https://auth.expo.io/@arnesh512/TripSaathi
npx expo whoami (expo account)
npx eas whoami (eas account)
-> shows loggined username of expo/eas 
-> app.json contains the slug 

npx expo config --type public
-> view app.json in cli












npx eas/eas-cli@latest init
arnesh512 (asking for account to link)
yes (create a project for @arnesh512/TripSaathi ?)

npx eas/eas-cli@latest init --id <id eg : f7fb604b-4c1d-4231-9424-16e647ceb41c>
-> using --id we specify link empty project from cloud which have this id to the project
-> otherwise it creates new project in cloud and uses that new id






npx eas-cli@latest credentials
-> manage credentials for android, iOS






npx eas/eas-cli@latest build -p/--platform android/ios/all --profile preview/production/development
com.arnesh.tripsaathi (asked if not present in app.json for android,ios)
-> preview builds apk
-> production builds aab for play store
-> development builds apk + dev tools + reload 










mkdir .eas\workflows && type nul > .eas\workflows\create-production-builds.yml






npx eas-cli@latest workflow:run create-production-builds.yml