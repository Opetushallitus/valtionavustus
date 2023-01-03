select id,
       created_at,
       content->'name' as name,
       json_build_object('start', content#>>'{duration,start}', 'end', content#>>'{duration,end}')::jsonb as duration,
       status,
       register_number
from avustushaut
where id in (:ids)
order by content#>>'{duration,end}' desc, content#>>'{duration,start}' desc
