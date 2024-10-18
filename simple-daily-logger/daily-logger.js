module.exports = function (RED) {
  function DailyLoggerNode(config) {
    const winston = require("winston");
    const DailyRotateFile = require("winston-daily-rotate-file");
    RED.nodes.createNode(this, config);
    var node = this;
    const timezoned = () => {
      return new Date().toLocaleString(config.localesArgument, {
        timeZone: config.timeZone,
      });
    };
    var fileName = `%DATE%.log`;
    if (config.fileName === "") {
      fileName = "%DATE%.log";
    } else {
      fileName = `${config.fileName}-%DATE%.log`;
    }
    const transportDaily = new DailyRotateFile({
      dirname: config.logDirectory || "/var/log",
      filename: fileName,
      datePattern: config.datePattern || "DD-MM-YYYY",
      maxSize: `${config.maxSize || 10}m`,
      maxFiles: `${config.maxFiles || 30}d`,
      prepend: true,
      level: "info",
      prettyPrint: true,
      zippedArchive: false,
    });
    const logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp({ format: timezoned }),
        winston.format.json()
      ),
      transports: [transportDaily],
    });
    function updateNodeStatus(logLevel) {
      node.status({
        fill: "green",
        shape: "dot",
        text: `${logLevel} logged [${timezoned()}]`,
      });
    }
    function clearNodeStatus(timeout = 1000) {
      setTimeout(() => {
        node.status({});
      }, timeout);
    }
    node.on("input", function (msg) {
      const logLevel = msg.level || "info";
      if (logger.levels[logLevel] !== undefined) {
        logger.log(logLevel, msg.payload);
        updateNodeStatus(logLevel);
        clearNodeStatus();
      } else {
        logger.info(msg.payload);
        updateNodeStatus("info");
        clearNodeStatus();
      }
    });

    node.on("close", function () {
      logger.close();
      clearNodeStatus(0);
    });
  }
  RED.nodes.registerType("daily-logger", DailyLoggerNode);
};
