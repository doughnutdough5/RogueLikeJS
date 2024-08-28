import chalk from 'chalk';
import figlet from 'figlet';
import readlineSync from 'readline-sync';
import { startGame } from './game.js';
import {waitSeconds, saveData, loadData, loadFiles } from './util.js';

// 로비 화면을 출력하는 함수
function displayLobby() {
  console.clear();

  // 타이틀 텍스트
  displayTitle();

  // 상단 경계선
  const line = chalk.magentaBright('='.repeat(50));
  console.log(line);

  // 게임 이름
  console.log(chalk.yellowBright.bold('CLI 게임에 오신것을 환영합니다!'));

  // 설명 텍스트
  console.log(chalk.green('옵션을 선택해주세요.'));
  console.log();

  // 옵션들
  console.log(chalk.blue('1.') + chalk.white(' 새로운 게임 시작'));
  console.log(chalk.blue('2.') + chalk.white(' 리플레이'));
  console.log(chalk.blue('3.') + chalk.white(' 업적 확인하기'));
  console.log(chalk.blue('4.') + chalk.white(' 종료'));

  // 하단 경계선
  console.log(line);

  // 하단 설명
  console.log(chalk.gray('1-4 사이의 수를 입력한 뒤 엔터를 누르세요.'));
}

function displayTitle() {
  console.log(
    chalk.cyan(
      figlet.textSync('RL- Javascript', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      }),
    ),
  );
}

async function displayReplay() {
  console.clear();
  displayTitle();
  const line = chalk.magentaBright('='.repeat(50));
  console.log(line);
  console.log(chalk.green('리플레이 리스트\n'));

  const fileList = loadFiles();
  if (fileList.length === 0) {
    console.log(chalk.redBright('리플레이가 없습니다. 메인메뉴로 돌아갑니다.'));
    await waitSeconds(1);
    main();
    return;
  }
  for (let i = 0; i < fileList.length; i++) {
    console.log(`${chalk.blue(`[${i}]`)}: ${fileList[i]}`);
  }

  console.log(line);
  console.log();
  console.log(chalk.gray('보고 싶은 리플레이의 번호를 입력하세요.'));
  let choice;
  while (true) {
    choice = readlineSync.question('입력: ');
    if (parseInt(choice) >= fileList.length || isNaN(parseInt(choice))) {
      continue;
    } else {
      break;
    }
  }
  const choicedReplay = loadData(fileList[parseInt(choice)]);
  await Replay(choicedReplay);
}

async function replayStage(stage, player, monster, logs, win) {
  const displayStatus = () => {
    console.clear();
    console.log(chalk.magentaBright(`\n=== Current Status ===`));
    console.log(
      chalk.cyanBright(`| Stage: ${stage} `) +
        chalk.blueBright(
          `| 플레이어 정보 HP: ${player.hp > 0 ? player.hp : 0}, Attack: ${player.atk} ~ ${player.atk + Math.floor(player.atk * player.maxAtkRate)} Armor: ${player.armor} `,
        ) +
        chalk.redBright(
          `| 몬스터 정보 HP: ${monster.hp > 0 ? monster.hp : 0}, Attack: ${monster.atk} |`,
        ),
    );
    console.log(chalk.magentaBright(`=====================\n`));
  };

  displayStatus();
  await waitSeconds(1.5);

  const tmp = [];
  for (let l of logs) {
    tmp.push(l);
    // 몬스터 턴은 무조건 공격
    if (l.turn === 'monster') {
      if (monster.atk > player.armor) {
        player.hp -= l.damage;
      }
    } else if (
      l.turn === 'player' &&
      (l.type === 'attack' || l.type === 'defence' || l.type === 'skill')
    ) {
      monster.hp -= l.damage;
    }
    displayStatus();
    tmp.forEach((e) => {
      if (e.turn === 'player') {
        console.log(chalk.green(e.msg));
      } else {
        console.log(chalk.red(e.msg));
      }
    });
    await waitSeconds(1);
  }

  if (win) {
    console.log(chalk.green('승리하였습니다!'));
    console.log(chalk.greenBright(`플레이어의 체력이 ${stage * 10} 회복되었습니다!`));
    console.log(chalk.greenBright('플레이어의 능력치가 올랐습니다!'));
  } else {
    console.log(chalk.red('패배하였습니다.'));
  }

  await waitSeconds(1.5);
}

async function Replay(choicedReplay) {
  // choicedReplay는 배열
  // i가 stage
  let len = choicedReplay.length;
  for (let i = 0; i < len; i++) {
    await replayStage(
      i + 1,
      choicedReplay[i].player,
      choicedReplay[i].monster,
      choicedReplay[i].logs,
      choicedReplay[i].win,
    );
  }

  if (len < 10) {
    console.log(chalk.red(`최종 기록: stage ${len}`));
  } else {
    console.log(chalk.green('모든 스테이지를 클리어 했습니다!'));
  }

  await waitSeconds(2);
  start();
}

// 유저 입력을 받아 처리하는 함수
async function handleUserInput() {
  const choice = readlineSync.question('입력: ');

  switch (choice) {
    case '1':
      console.log(chalk.green('게임을 시작합니다.'));
      // 여기에서 새로운 게임 시작 로직을 구현
      const logs = await startGame();
      return logs;
    case '2':
      displayReplay();
      break;
    case '3':
      console.log(chalk.yellow('구현 준비중입니다.. 게임을 시작하세요'));
      // 업적 확인하기 로직을 구현
      handleUserInput();
      break;
    case '4':
      console.log(chalk.red('게임을 종료합니다.'));
      // 게임 종료 로직을 구현
      process.exit(0); // 게임 종료
    default:
      console.log(chalk.red('올바른 선택을 하세요.'));
      handleUserInput(); // 유효하지 않은 입력일 경우 다시 입력 받음
  }
}

// 게임 시작 함수
async function start() {
  displayLobby();

  const logs = await handleUserInput();
  if (logs) {
    return logs;
  }

  return null;
}

async function main() {
  const logs = await start(); // game.js의 함수, 여기서 logs 얻어와서 저장하기
  if (logs) {
    // 파일로 저장하기
    saveData(logs);
  }
}

// 게임 실행
main();
