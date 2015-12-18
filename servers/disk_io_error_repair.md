If there are disk errors like this in dmesg output

    [75879.571232] XFS (dm-1): metadata I/O error: block 0x5000b0 ("xfs_trans_read_b
    uf_map") error 5 numblks 8
    [75909.216173] XFS (dm-1): xfs_log_force: error 5 returned.
    [75939.296151] XFS (dm-1): xfs_log_force: error 5 returned.
    [75969.376106] XFS (dm-1): xfs_log_force: error 5 returned.
    [75999.456154] XFS (dm-1): xfs_log_force: error 5 returned.

you can check which partitions are broken for example like this:

     for mountpoint in `mount | grep persistent.volumes | cut -f 3 -d ' '`; do echo == $mountpoint : =============; umount $mountpoint; mount $mountpoint; df -h $mountpoint; done

Procedure for repair goes more or less like
* kill all processes attempting to access the broken filesystem
  * kill java processes: `pkill java`
  * stop postgres: `sudo service postgresql stop`
* unmount the broken filesystem
* run xfs_repair on the device of the filesystem, following its instructions (they might include a mount + unmount and running xfs_repair again)
* after xfs_repair has Finished successfully, mount the fixed filesystem.

Here is an example run from when /dev/mapper/persistent.volumes-postgresql_data mounted on /var/lib/postgresql was broken:

````
root@va-test:~# xfs_repair /dev/mapper/persistent.volumes-postgresql_data
xfs_repair: /dev/mapper/persistent.volumes-postgresql_data contains a mounted filesystem

fatal error -- couldn't initialize XFS library
root@va-test:~# umount /var/lib/postgresql
umount: /var/lib/postgresql: device is busy.
        (In some cases useful info about processes that use
         the device is found by lsof(8) or fuser(1))
root@va-test:~# fuser -m /var/lib/postgresql
Cannot stat /var/lib/postgresql: Input/output error
Cannot stat file /proc/1543/fd/10: Input/output error
Cannot stat file /proc/1545/fd/10: Input/output error
Cannot stat file /proc/1546/fd/10: Input/output error
Cannot stat file /proc/13368/fd/4: Input/output error
Cannot stat file /proc/13368/fd/34: Input/output error
Cannot stat file /proc/13368/fd/38: Input/output error
Cannot stat file /proc/13368/fd/44: Input/output error
root@va-test:~# kill 13368
root@va-test:~# kill 1543
root@va-test:~# kill 1545
-su: kill: (1545) - No such process
root@va-test:~# kill 1546
-su: kill: (1546) - No such process
root@va-test:~# fuser -m /var/lib/postgresql
Cannot stat /var/lib/postgresql: Input/output error
root@va-test:~# umount /var/lib/postgresql
root@va-test:~# xfs_repair /dev/mapper/persistent.volumes-postgresql_data
Phase 1 - find and verify superblock...
Phase 2 - using internal log
        - zero log...
ERROR: The filesystem has valuable metadata changes in a log which needs to
be replayed.  Mount the filesystem to replay the log, and unmount it before
re-running xfs_repair.  If you are unable to mount the filesystem, then use
the -L option to destroy the log and attempt a repair.
Note that destroying the log may cause corruption -- please attempt a mount
of the filesystem before doing this.
root@va-test:~# mount /var/lib/postgresql
root@va-test:~# ls /var/lib/postgresql
9.4  backup
root@va-test:~# umount /var/lib/postgresql
root@va-test:~# xfs_repair /dev/mapper/persistent.volumes-postgresql_data
Phase 1 - find and verify superblock...
Phase 2 - using internal log
        - zero log...
        - scan filesystem freespace and inode maps...
        - found root inode chunk
Phase 3 - for each AG...
        - scan and clear agi unlinked lists...
        - process known inodes and perform inode discovery...
        - agno = 0
        - agno = 1
        - agno = 2
        - agno = 3
        - process newly discovered inodes...
Phase 4 - check for duplicate blocks...
        - setting up duplicate extent list...
        - check for inodes claiming duplicate blocks...
        - agno = 0
        - agno = 1
        - agno = 2
        - agno = 3
Phase 5 - rebuild AG headers and trees...
        - reset superblock...
Phase 6 - check inode connectivity...
        - resetting contents of realtime bitmap and summary inodes
        - traversing filesystem ...
        - traversal finished ...
        - moving disconnected inodes to lost+found ...
Phase 7 - verify and correct link counts...
done
root@va-test:~# mount /var/lib/postgresql
root@va-test:~# df -h /var/lib/postgresql
Filesystem                                      Size  Used Avail Use% Mounted on
/dev/mapper/persistent.volumes-postgresql_data   10G  124M  9.9G   2% /var/lib/postgresql

````