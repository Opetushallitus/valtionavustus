select * from koodisto_cache where koodisto_uri = :koodisto_uri and version = :version order by created_at desc limit 1
