#!/bin/bash

# **** MAKE SURE YOU ARE AT BASE DIRRECTORY (the KipsWarehouse folder) ****
# It auto generates models for you and recover the ones you do not want to change

sequelize-auto -o "./models" -d KipsWarehouseDevDB -h 198.199.77.103 -u remote_dev -p 3306 -x wUkw7ZaGCBarMTZToRmD -e mysql

git checkout models/tags.js
echo 'Reverted changes on models/tags.js'

git checkout models/item_tag_pairs.js
echo 'Reverted changes on models/item_tag_pairs.js'

git checkout models/items.js
echo 'Reverted changes on models/items.js'

git checkout models/custom_field_values.js
echo 'Reverted changes on models/custom_field_values.js'

git checkout models/instance_custom_field_values.js
echo 'Reverted changes on models/instance_custom_field_values.js'

git checkout models/item_instances.js
echo 'Reverted changes on models/item_instances.js'
