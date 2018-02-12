const Subscription = require('egg').Subscription;

class Calculation extends Subscription {
	// 通过 schedule 属性来设置定时任务的执行间隔等配置
	static get schedule() {
		return {
			interval: '10s', // 1 分钟间隔
			type: 'worker', // 指定所有的 worker 都需要执行
		};
	}

	// subscribe 是真正定时任务执行时被运行的函数
	async subscribe() {
		const inOneDay = new Date().getTime() - 24 * 3600 * 1000;

		const queueOrders = await this.ctx.app.mysql.query('SELECT id_, parameters FROM xundrug_order WHERE status=? AND createTime>? ORDER BY createTime ASC', ['9', inOneDay]);

		if (queueOrders.length > 0) {
			const orderId = queueOrders[0].id_;
			const parameters = JSON.parse(queueOrders[0].parameters);
			// 调用python计算
			const { exec } = require('child_process');
			var cmdStr = 'ps -aux | grep python | grep ca_ |wc -l';
			exec(cmdStr, function (err, stdout, stderr) {
				let isRunning = null;
				if (process.env.NODE_ENV === 'production') {
					isRunning = stdout && stdout > 1;
				} else {
					isRunning = stdout && stdout < 1;
				}
				if (!isRunning) { // python计算的加锁条件, 调用python程序直接计算。
					console.log('debug')

					// const calTypePy = parameters.calSort ? `ca_${parameters.calSort}_${parameters.calType}_sql.py` : `ca_${parameters.calType}_sql.py`
					// const { spawn } = require('child_process');
					// const data = [];
					// data.push(orderId);

					// const py = spawn('python', [calTypePy]);
					// py.stdin.write(JSON.stringify(data));
					// py.stdin.end();
					// py.on('error', function (err) {
					// 	console.log('error');
					// 	// logger.error(`orderId:${orderId},userid:${userid},status:${status} 调用python失败 => ${err}`);
					// 	process.exit();
					// });


					const { spawn } = require('child_process');

					const py = spawn('python', [`../src/ca_all_moltox.py`]);

					const data = [], dataString = '';
					data.push("CN(C)CCCN1C2=CC=CC=C2SC2=C1C=C(C=C2)C(C)=O", "0.1");
					py.stdout.on('data', function (data) {
						dataString += data.toString();
					});

					py.stdout.on('end', function () {
						// var json = JSON.parse(dataString.replace(/\\/g, '').replace(/\"\[/g, '[').replace(/\]\"/g, ']'));
						console.log(dataString)
					});

					py.on('error', function (err) {
						console.log(new Date());
						console.log('开启失败', err);
						process.exit();
					});

				}
			});
		}
	}
}

module.exports = Calculation;