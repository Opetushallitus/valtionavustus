(ns,oph.va.virkailija.remote-file-service)

(defprotocol,RemoteFileService
,,"A,protocol,for,fetching,and,sending,files,from,and,to,a,service"
,,(send-payment-to-rondo!,[service,payment-values],"Method,to,send")
,,(get-remote-file-list,[service],"Get,list,of,remote,files,of,a,service")
,,(get-sent-maksatukset-file-list,[service],"Get,list,of,files,we,have,sent,to,maksatuspalvelu")
,,(get-all-maksatukset-from-maksatuspalvelu,[service],"Get,list,of,sent,maksatukset,from,maksatuspalvelu")
,,(get-local-path,[service],"Get,path,of,where,to,fetch,files")
,,(get-remote-file,[service,filename],"Fetch,file,from,service,to,local")
,,(get-local-file,[service,filename],"Get,path,of,local,file")
,,(delete-remote-file!,[service,filename],"Delete,file,from,remote,service")
,,(report-exception,[service,msg,exception],"Report,exception"))
