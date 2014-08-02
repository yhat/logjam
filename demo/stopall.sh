#!/bin/bash
initctl list | grep jam_job | grep -Eo "\(.+\)" | grep -ioE [a-z]+ | xargs -I '{}' sudo stop jam_job name='{}'
