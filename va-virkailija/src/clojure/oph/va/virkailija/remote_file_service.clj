(ns oph.va.virkailija.remote-file-service)

(defprotocol RemoteFileService
             "Protocol for sending and fetching files to and from remote. Used for both RondoService and testing. In the latter case a dummy connection is given."
  (get-remote-file-list [this] "Get list of files from either remote sftp server or a dummy list for testing")
  (do-sftp! [this] "implement methods for get, put, cd and ls for either in sftp server or as dummy")
  (send-to-rondo! [this] "Generates xmls from applications and sends them to remote server")
  (get-local-path [this] "Give local file path")
  (get-remote-file [this filename] "Fetch file from remote sftp-server or give a dummy list")
  (get-local-file [this filename] "Returns path for file that has been fetched from remote")
  (delete-remote-file [this filename] "Delete file from remote sftp-server"))
