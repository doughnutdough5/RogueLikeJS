import chalk from 'chalk';
import readlineSync from 'readline-sync';
import { waitSeconds } from './util.js';

const rand = (min, max) => Math.floor(Math.random() * (max - min)) + min;

class Entity {
  constructor(hp, atk) {
    this.hp = hp ? hp : rand(20, 50);
    this.atk = atk ? atk : rand(5, 20);
  }

  attack(enemy) {
    enemy.hit(this.atk);
  }

  hit(damage) {
    this.hp -= damage;
  }
}

class Player extends Entity {
  constructor(hp, atk, maxAtkRate, armor) {
    super(hp, atk);
    this.maxAtkRate = maxAtkRate ? maxAtkRate : Math.floor(Math.random() * 100) / 100;
    this.runAwayRate = rand(10, 30);
    this.armor = armor ? armor : rand(3, 10);
  }

  printAtk() {
    return `${this.atk} ~ ${this.atk + Math.floor(this.atk * this.maxAtkRate)}`;
  }

  attack(enemy) {
    const maxAtk = this.atk + Math.floor(this.atk * this.maxAtkRate);
    let atk = 0;
    if (rand(1, 100) < 20) {
      // 20% 확률로 최대 공격
      atk = maxAtk;
    } else {
      // 80% 확률로 최소 공격력 ~ 최대 공격력 사이 공격
      atk = rand(this.atk, maxAtk);
    }

    enemy.hit(atk);
    return { msg: `몬스터에게 ${atk}의 피해를 입혔습니다!`, damage: atk };
  }

  hit(damage) {
    let finalDamage = damage - this.armor;
    if (finalDamage > 0) {
      this.hp -= finalDamage;
    } else {
      finalDamage = 0;
    }

    return finalDamage
      ? { msg: `몬스터가 ${finalDamage}의 피해를 입혔습니다!`, damage: finalDamage }
      : { msg: '플레이어의 아머가 더 단단해서 피해를 입지 않았습니다!', damage: finalDamage };
  }

  heal(amount) {
    this.hp += amount;
  }

  defence(enemy) {
    if (rand(1, 100) < 50) {
      // 방어 실패
      return { result: false, msg: '방어에 실패하였습니다.', damage: 0 };
    }

    if (rand(1, 100) < 60) {
      // 반격 성공
      const attack = this.attack(enemy);
      return { result: true, msg: `반격 성공! ${attack.msg}`, damage: attack.damage };
    }

    return { result: true, msg: '방어 성공!', damage: 0 };
  }

  powerAttack(enemy) {
    if (rand(1, 100) < 50) {
      // 강격 성공
      const damage = this.atk + Math.floor(this.atk * this.maxAtkRate) * 1.5;
      enemy.hit(damage);
      return {
        result: true,
        msg: `강격 성공! ${damage}의 데미지를 입혔습니다!`,
        damage: damage,
      };
    }

    // 실패, 턴 날림
    return {
      result: false,
      msg: `강격 실패!`,
      damage: 0,
    };
  }

  escape() {
    if (rand(1, 100) < 30) {
      return { result: true, msg: `도망 성공!` };
    }

    return { result: false, msg: `도망 실패!` };
  }

  increaseStatus() {
    // this.hp += rand(20, 50); // FIX: heal 메서드 사용
    this.atk += rand(5, 20);
    this.maxAtkRate += Math.floor(Math.random() * 100) / 100;
    this.runAwayRate += rand(1, 3);
    this.armor += rand(3, 10);
  }

  clone() {
    return new Player(this.hp, this.atk, this.maxAtkRate, this.armor);
  }
}

class Monster extends Entity {
  attack(enemy) {
    return enemy.hit(this.atk);
  }

  increaseStatus(stage) {
    this.hp += stage * rand(5, 15);
    this.atk += stage * rand(5, 8);
  }

  clone() {
    return new Monster(this.hp, this.atk);
  }
}

class TurnLog {
  constructor(player, monster) {
    this.player = player;
    this.monster = monster;
    this.logs = [];
    this.win = null;
  }
}

const log = console.log;
function displayStatus(stage, player, monster) {
  log(chalk.magentaBright(`\n=== Current Status ===`));
  log(
    chalk.cyanBright(`| Stage: ${stage} `) +
      chalk.blueBright(
        `| 플레이어 정보 HP: ${player.hp > 0 ? player.hp : 0}, Attack: ${player.printAtk()} Armor: ${player.armor} `,
      ) +
      chalk.redBright(
        `| 몬스터 정보 HP: ${monster.hp > 0 ? monster.hp : 0}, Attack: ${monster.atk} |`,
      ),
  );
  log(chalk.magentaBright(`=====================\n`));
}

const battle = async (stage, player, monster) => {
  let i = 0;
  let logs = [];
  const turnLogs = new TurnLog(player.clone(), monster.clone());

  while (true) {
    console.clear();
    displayStatus(stage, player, monster);

    logs.forEach((log) => console.log(log));
    if (player.hp <= 0) {
      turnLogs.win = false;
      break;
    }

    if (monster.hp <= 0) {
      // 라운드 종료
      turnLogs.win = true;
      break;
    }

    log(
      chalk.green(
        `\n1. 공격한다 2. 방어한다 (50%) 3. 도망친다 (30%) 4. 강하게 공격 (50%) 0. 아무것도 하지않는다.`,
      ),
    );
    const choice = readlineSync.question('당신의 선택은? ');

    let defendSucceed = null;
    let escapeSucceed = null;
    // 플레이어 턴 처리
    switch (choice) {
      case '1': // 공격
        const attack = player.attack(monster);
        logs.push(chalk.green(attack.msg));
        turnLogs.logs[i] = {
          turn: 'player',
          type: 'attack',
          msg: attack.msg,
          damage: attack.damage,
        };
        break;
      case '2': // 방어
        const defence = player.defence(monster);
        defendSucceed = defence.result;
        if (defendSucceed) {
          logs.push(chalk.green(defence.msg));
        } else {
          logs.push(chalk.red(defence.msg));
        }
        turnLogs.logs[i] = {
          turn: 'player',
          type: 'defence',
          msg: defence.msg,
          damage: defence.damage,
        };
        break;
      case '3': // 도망
        const escape = player.escape();
        escapeSucceed = escape.result;
        if (escapeSucceed) {
          logs.push(chalk.green(escape.msg));
        } else {
          logs.push(chalk.red(escape.msg));
        }
        turnLogs.logs[i] = {
          turn: 'player',
          type: 'escape',
          msg: escape.msg,
          succeed: escape.result,
        };
        break;
      case '4': // 스킬
        const powerAttack = player.powerAttack(monster);
        if (powerAttack.result) {
          logs.push(chalk.green(powerAttack.msg));
        } else {
          logs.push(chalk.red(powerAttack.msg));
        }
        turnLogs.logs[i] = {
          turn: 'player',
          type: 'skill',
          msg: powerAttack.msg,
          damage: powerAttack.damage,
        };
        break;
      case '0': // 아무것도 하지 않는다, 맞기만 하기
        logs.push(chalk.green('아무것도 하지 않았습니다.'));
        turnLogs.logs[i] = {
          turn: 'player',
          type: 'nothing',
          msg: '아무것도 하지 않았습니다.',
        };
        break;
    }

    // 도망 성공
    if (escapeSucceed) {
      turnLogs.win = true;
      break;
    }

    // 몬스터 턴 처리
    if (!defendSucceed && !escapeSucceed && monster.hp > 0) {
      const attack = monster.attack(player);
      i++;
      turnLogs.logs[i] = {
        turn: 'monster',
        type: 'attack',
        msg: attack.msg,
        damage: attack.damage,
      };
      logs.push(chalk.red(attack.msg));
    }
    i++;
  }

  return { result: turnLogs.win, logs: turnLogs };
};

export async function startGame() {
  console.clear();
  const player = new Player();
  let stage = 0;
  const roundLogs = [];

  while (true) {
    // 스테이지 클리어 및 게임 종료 조건
    stage++;
    const monster = new Monster();
    // stage 별 hp, attack 가중치 두기
    monster.increaseStatus(stage);

    let result = await battle(stage, player, monster);
    roundLogs[stage - 1] = result.logs;

    // 죽음
    if (!result.result) {
      log(chalk.red('패배하였습니다.'));
      log(chalk.red(`최종기록: stage ${stage}`));
      break;
    } else {
      log(chalk.green('승리하였습니다!'));
    }

    // 승리
    if (stage === 10 && result.result) {
      log(chalk.green('모든 스테이지를 클리어 했습니다!'));
      break;
    }

    player.heal(stage * 10);
    log(chalk.greenBright(`플레이어의 체력이 ${stage * 10} 회복되었습니다!`));
    player.increaseStatus();
    log(chalk.greenBright('플레이어의 능력치가 올랐습니다!'));
    await waitSeconds(2);
  }

  return roundLogs;
}
