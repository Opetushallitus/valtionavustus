(ns oph.va.virkailija.xml-validator)

(import 'javax.xml.XMLConstants)
(import 'org.xml.sax.SAXException)
(import 'javax.xml.validation.SchemaFactory)
(import 'java.io.File)
(import 'java.io.StringReader)
(import 'javax.xml.transform.stream.StreamSource)

(defn- load-schema-file [file]
  (-> (File. file)
      (StreamSource.)))

(defn- init-validator [schema-sources]
  (-> (SchemaFactory/newInstance XMLConstants/W3C_XML_SCHEMA_NS_URI)
      (.newSchema schema-sources)
      (.newValidator)))

(defn create-validator [& schemas]
  "Clojure-Java-wrapper for creating XML validator from schema file.
  You can give one or more file paths. Function returns function, which can be
  used for validating xml documents in string format.
  Validating function returns nil if xml is valid and message if xml is not
  valid.
  This module is for testing purposes mainly and has no optimizations or so."
  (let [validator (init-validator
                    (into-array StreamSource (map load-schema-file schemas)))]
    (fn [xml-str]
      (try
        (.validate
          validator
          (-> xml-str
              (StringReader.)
              (StreamSource.)))
        nil
        (catch SAXException e (.getMessage e))))))
