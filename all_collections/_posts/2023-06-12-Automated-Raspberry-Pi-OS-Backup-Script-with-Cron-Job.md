---
layout: post
title: Automated Raspberry Pi OS Backup Script with Cron Job
date: 2023-06-12 02:37:00
categories: [self-host, IoT, Raspberry-Pi]
---

![header image](/assets/images/2023-06-12-Automated-Raspberry-Pi-OS-Backup-Script-with-Cron-Job/raspibanner.jpg)

Raspberry Pi enthusiasts often invest time and effort into setting up their systems just the way they want them. To protect this investment, creating regular backups is crucial. In this article, we'll explore a simple yet effective Bash script that automates the process of backing up a Raspberry Pi 4 running Raspbian OS. This script utilizes the dd command to clone the entire SD card, and it runs weekly through a cron job for hands-free, scheduled backups.

## The Backup Script

Let's break down the bash script:

```bash
sudo dd if=/dev/mmcblk0 bs=1M | pv -petrab | gzip > /mnt/bak/backup_$(date +%Y-%m-%d_%H-%M-%S).gz
```

**sudo**: Runs the command with superuser privileges, necessary for accessing system-level information.
**dd**: A command-line utility for copying and converting files, in this case, used to clone the Raspberry Pi's SD card.
**if**=/dev/mmcblk0: Specifies the input file, representing the SD card device.
**bs**=1M: Sets the block size to 1 megabyte, optimizing the data transfer process.
**pv -petrab**: Utilizes pv (Pipe Viewer) to display a progress bar (-p) and other relevant information during the data transfer.
**gzip**: Compresses the data stream before writing it to the output file.
**> /mnt/bak/backup_$(date +%Y-%m-%d_%H-%M-%S).gz**: Redirects the compressed data to a timestamped backup file in the specified directory.

## Setting Up the Script

### Create a Bash Script

Open a text editor and paste the script. Save it as backup_script.sh or any name you prefer.

### Make the Script Executable

Run the following command in the terminal to grant execution permission to the script:

```bash
chmod +x backup_script.sh
```

Mount USB Stick:
Ensure that your USB stick is properly mounted on the Raspberry Pi, and note the mount point (e.g., /mnt/bak).

Schedule Weekly Backups with Cron:
Open the crontab configuration by running:

```bash
crontab -e
```

Add the following line to schedule the script to run every week:

```bash
0 0 * * 0 /path/to/backup_script.sh
```

This example schedules the backup to run every Sunday at midnight. Adjust the timing to your preference.

With this simple yet powerful backup script and the scheduling capabilities of cron, Raspberry Pi users can ensure the safety of their valuable data. Regular backups provide peace of mind, allowing enthusiasts to experiment with their setups without the fear of losing important configurations or data. Remember to tailor the script and schedule to your specific needs, and enjoy the convenience of automated Raspberry Pi OS backups.

## Restoring from Backup

Creating regular backups is a smart practice, but knowing how to restore from those backups is equally important. If the need arises to recover your Raspberry Pi from a backup, the dd command can be used in reverse to write the backup file back to the SD card (I advise you to do it in another machine and not on the raspberry to prevent data loss). Here's a step-by-step guide:

### Insert a Blank SD Card:

Ensure you have a blank SD card with sufficient capacity to accommodate the backup.

### Identify the SD Card Device:

Use the lsblk or fdisk -l command to identify the device name of your SD card. It's typically something like /dev/mmcblk0 but could vary.

### Unmount Partitions:

Before writing the backup, make sure that any partitions on the SD card are unmounted. You can use the umount command for this purpose:

```bash
sudo umount /dev/mmcblk0*
```

## Restore the Backup

Use the dd command to restore the backup to the SD card. Make sure to replace /path/to/backup/file.gz with the actual path to your backup file and /dev/mmcblk0 with your SD card device:

```bash
sudo gzip -dc /path/to/backup/file.gz | sudo dd of=/dev/mmcblk0 bs=1M
```

This command decompresses the backup file on the fly (gzip -dc) and writes it to the SD card.

### Wait for Completion:

The process may take some time depending on the size of the backup. Be patient and allow the command to complete.

### Verify the Restoration:

After completion, you can verify the restoration by checking the partitions on the SD card using lsblk or fdisk -l.

### Reboot the Raspberry Pi:

Once the restoration is successful, safely eject the SD card and insert it back into the Raspberry Pi. Power on the Pi, and it should boot with the restored system.

Remember, the dd command is powerful but can be destructive if misused. Ensure that you've correctly identified the SD card device and double-check the command before executing it. Having a solid understanding of the backup and restore process is crucial for maintaining the integrity of your Raspberry Pi system.

## Enhanced Backup Script with Future Features

In this section, we'll delve into an improved version of the backup script, incorporating advanced features for cloud storage integration (MinIO S3 bucket) and a robust deduplicating backup solution (Borg). This enhanced script not only automates local backups but also extends your Raspberry Pi data protection strategy to the cloud and introduces a sophisticated backup management tool. Let's explore the updated script and its additional functionalities.

```bash
#!/bin/bash

# Path to the backup directory
BACKUP_DIR="/mnt/bak"

# Path to the MinIO client (mc) binary
MC_PATH="/usr/local/bin/mc"

# Function to perform the backup
perform_backup() {
    sudo dd if=/dev/mmcblk0 bs=1M | pv -petrab | gzip > "$BACKUP_DIR/backup_$(date +%Y-%m-%d_%H-%M-%S).gz"
}

# Function to upload backup to MinIO (S3 bucket)
upload_to_minio() {
    $MC_PATH cp "$BACKUP_DIR/backup_*.gz" minio/bucket_name/
}

# Function to create a Borg backup
create_borg_backup() {
    borg create /path/to/borg/repository::'{now:%Y-%m-%d_%H:%M:%S}' /mnt/bak
}

# Perform the backup
perform_backup

# Upload to MinIO (S3 bucket)
upload_to_minio

# Create a Borg backup
create_borg_backup
```

### Backup Directory Configuration

Set the BACKUP_DIR variable to the path where you want to store your local backups.

### MinIO (S3 Bucket) Integration

Download and install the MinIO client (mc) binary to /usr/local/bin/mc or adjust the MC_PATH variable accordingly.
The upload_to_minio function uses the MinIO client to upload the latest backup to the specified bucket (minio/bucket_name/). Ensure to replace minio/bucket_name/ with your MinIO bucket path.

### Borg Integration

The create_borg_backup function demonstrates creating a Borg backup. Make sure to replace /path/to/borg/repository with the actual path to your Borg repository.
Borg is a powerful deduplicating backup program that allows efficient and space-saving backups.

### Execution

After performing the initial backup, the script proceeds to upload the compressed backup to MinIO and create a Borg backup.

### Cron Job

Adjust the cron job to run the script regularly. Ensure that the user running the cron job has the necessary permissions to execute the script and access relevant directories.

This updated script provides a foundation for integrating cloud storage (MinIO) and advanced backup solutions (Borg) into your Raspberry Pi backup strategy. Customize the script further based on your specific requirements and preferred backup solutions.

## Conclusion

In the ever-evolving landscape of Raspberry Pi enthusiasts and IoT enthusiasts, safeguarding your meticulously configured systems is paramount. This article has taken you on a journey through the creation of a robust automated backup script, ensuring the protection of your Raspberry Pi 4 running Raspbian OS.

The initial script presented here, leveraging the powerful dd command and scheduled with a cron job, forms a solid foundation for routine, hands-free backups. This ensures that your Raspberry Pi setup remains resilient to unforeseen events, allowing you to experiment and innovate with confidence.

Understanding the restoration process is equally crucial, and the step-by-step guide provided empowers you to recover from backups seamlessly. Whether it's a simple hardware upgrade or an unexpected system failure, the ability to restore your Raspberry Pi from a backup ensures continuity and peace of mind.

Looking forward, the article introduced an enhanced backup script with future features. By integrating cloud storage through MinIO (S3 bucket) and leveraging the capabilities of Borg for deduplicating backups, this script elevates your data protection strategy. The flexibility to adapt the script to your specific needs and preferred backup solutions opens doors to a more comprehensive and sophisticated approach to data security.

As you embark on your Raspberry Pi journey, remember that a well-thought-out backup strategy is your safety net. Regularly revisiting and enhancing your backup scripts ensures that your projects and configurations remain resilient in the face of challenges. Tailor the script to your evolving needs, explore additional features, and enjoy the peace of mind that comes with a robust backup and recovery system for your Raspberry Pi.
