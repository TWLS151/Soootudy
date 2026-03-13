import sys

sys.stdin = open('input.txt', 'r')

T = int(input())

def make_cardlist():
    dict1 = dict()

    for i in range(10):
        dict1.setdefault(i, 0)

    return dict1

def check_babygin(card_list):
    for i in range(len(card_list)):  # 1. triplet 검사

        if card_list[i] >= 3:
            return True

    cnt = 0

    for i in range(len(card_list)):  # 2. run 검사

        if card_list[i] >= 1:
            cnt += 1

            if cnt == 3:
                return True

        else:
            cnt = 0

    return False

for tc in range(1, T + 1):

    cards = list(map(int, input().split()))

    # 1. 플레이어 별 카드 딕셔너리를 제작

    player1 = make_cardlist()
    player2 = make_cardlist()

    # 2. 입력 데이터를 받아오며 카드를 획득
    for i in range(6):
        card_1, card_2 = cards[i * 2], cards[i * 2 + 1]  # (1) 카드 분배

        player1[card_1] += 1
        player2[card_2] += 1

        if i >= 2:  #  (2) 3장 이상을 받은 후부터 승패 여부 판단

            if check_babygin(list(player1.values())):   # (3)-1. 1번 먼저 검사 -> 교대로 카드를 받기 때문
                print(f"#{tc} 1")
                break

            elif check_babygin(list(player2.values())): # (3)-2. 1번 승리조건 X -> 2번 검사 -> 조건 충족 시 2번 승리
                print(f"#{tc} 2")
                break

    else: print(f"#{tc} 0")                             # 승패가 갈리지 않고 반복문 종료 시 : 무승부
