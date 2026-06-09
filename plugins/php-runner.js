/**
 * PHP Plugin Runner
 * Executes a PHP plugin file as a child process.
 * The PHP file receives JSON via stdin and must echo JSON to stdout.
 *
 * Expected PHP plugin structure:
 *   $input = json_decode(file_get_contents('php://stdin'), true);
 *   $action = $input['action']; // 'charge' or 'verify'
 *   $data   = $input['data'];
 *   $config = $input['config'];
 *   // ... do work ...
 *   echo json_encode(['success' => true, 'redirect_url' => '...']);
 */

const { spawn } = require('child_process');

function runPhp(phpFile, payload) {
  return new Promise((resolve, reject) => {
    const php = spawn('php', [phpFile]);
    let stdout = '';
    let stderr = '';
    php.stdout.on('data', d => stdout += d);
    php.stderr.on('data', d => stderr += d);
    php.on('close', code => {
      if (code !== 0) return reject(new Error(stderr || `PHP exited with code ${code}`));
      try { resolve(JSON.parse(stdout)); }
      catch { reject(new Error(`PHP output not valid JSON: ${stdout}`)); }
    });
    php.stdin.write(JSON.stringify(payload));
    php.stdin.end();
  });
}

function makePhpPlugin(phpFile) {
  return {
    async charge(order, config) {
      const result = await runPhp(phpFile, { action: 'charge', data: order, config });
      if (result.error) throw new Error(result.error);
      return result;
    },
    async verify(params, config) {
      const result = await runPhp(phpFile, { action: 'verify', data: params, config });
      if (result.error) throw new Error(result.error);
      return result;
    },
    async getRates(payload, config) {
      const result = await runPhp(phpFile, { action: 'getRates', data: payload, config });
      if (result.error) throw new Error(result.error);
      return result;
    },
  };
}

module.exports = { makePhpPlugin };
