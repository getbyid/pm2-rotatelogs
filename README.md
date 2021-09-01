# PM2 Rotate Logs

Почему не годится рекомендуемый [модуль pm2-logrotate](https://github.com/keymetrics/pm2-logrotate):

* делит лог по размеру, а не по периоду времени
* висит в памяти отдельным процессом
* не заработал в кластере, что-то делал только с логами одного воркера

Нужен другой способ разделения логов PM2 по периодам, независимо от размера.

Предлагаемый скрипт запускается извне **по расписанию** (cron):

* подключается к pm2, для каждого воркера переименовывает накопившийся лог
* пересоздаёт логи через pm2 **reloadLogs**
* удаляет логи старше заданного периода (**10 недель** по-умолчанию)

## Проверка

Устанавливаем тестовое приложение:

~~~
$ npm i
~~~

Запускаем кластер:

~~~
$ pm2 start ecosystem.config.js
~~~

Видим логи:

~~~
$ ls ~/.pm2/logs/
TEST-APP-error-0.log  TEST-APP-error-1.log  TEST-APP-error-2.log  TEST-APP-error-3.log
TEST-APP-out-0.log  TEST-APP-out-1.log  TEST-APP-out-2.log  TEST-APP-out-3.log
~~~

Не останавливая кластер, запускаем скрипт:

~~~
$ node pm2-rotatelogs.js
Number of applications: 4
TEST_APP /home/user/.pm2/logs/2021-08-18T??-??-??_TEST-APP-out-0.log
TEST_APP /home/user/.pm2/logs/2021-08-18T??-??-??_TEST-APP-out-1.log
TEST_APP /home/user/.pm2/logs/2021-08-18T??-??-??_TEST-APP-out-2.log
TEST_APP /home/user/.pm2/logs/2021-08-18T??-??-??_TEST-APP-out-3.log
Delete logs older than 2021-06-09T??:??:?? from /home/user/.pm2/logs:
2021-08-18T??-??-??_TEST-APP-out-0.log skip
2021-08-18T??-??-??_TEST-APP-out-1.log skip
2021-08-18T??-??-??_TEST-APP-out-2.log skip
2021-08-18T??-??-??_TEST-APP-out-3.log skip
OK
~~~

Не забываем удалить тестовый кластер:

~~~
$ pm2 delete TEST_APP
~~~

## Запуск через cron (FreeBSD)

Каждую пятницу в 07:15

~~~
$ crontab -e
15 7 * * 5 node ~/api/current/pm2-rotatelogs.js
~~~

1-го числа каждого месяца в 07:55, логи хранить полгода (26 недель)

~~~
$ crontab -e
55 7 1 * * node ~/api/current/pm2-rotatelogs.js 26
~~~
