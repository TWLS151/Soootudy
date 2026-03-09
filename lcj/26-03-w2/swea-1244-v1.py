'''
1. 재해석
- 주어진 횟수 만큼 자리 수를 바꿔가면서 최대 상금 수를 찾자
- 주어지는 자리 수는 6자리, 10번 -> 완전 탐색 & 가지치기로 접근

2. 설계 - 접근 / 비접근 방식의 DFS로
- depth == N이면 최대값 갱신

3. 놓쳤던 부분

- 1 - 3, 교환 이후에 3 - 1은 또 볼 필요가 없다
-> 가지치기에 대해 깊게 고민해보지 않았음
-> 만약 한다면, 어떤 방식으로 해줄 수 있을 것인가?
--> 같은 depth에 price가 기록되어 있다면?

---> (1) 같은 자리 수를 교환했거나 (2) 같은 번호를 같은 순서에 교환한 경우
--> 코드리뷰) set을 활용
'''

import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

def dfs_switch(depth):
    global max_price

    price = int("".join(map(str, cards)))   # 현재 가격을 계산
    status = (depth, price)

    if status in history:                   # 1. 가지치기 - 이미 수행해본 교환에 대해서는 건너뛰기
        return

    if depth == N:                          # 종료 : 교환 모두 수행 시
        max_price = max(price, max_price)   # 최대값 검사 후 갱신
        return

    for i in range(M):                      # 전체 카드 중
        for j in range(M):                  # 선택할 쌍에 대해
            if i == j:                      # 같은 카드끼리는 변경 불가
                continue

            cards[i], cards[j] = cards[j], cards[i] # 자리 바꾸기
            history.add((depth, price))
            dfs_switch(depth + 1)

            cards[i], cards[j] = cards[j], cards[i]  # 자리 바꾸기

for tc in range(1, T+1):

    # 1. 입력
    cards, N = input().split()
    N = int(N)
    cards = list(map(int, list(cards)))
    M = len(cards)
    history = set()     # 교환 기록을 저장하기 위한 set 생성 (중복 방지)

    # 2. 필요한 초기값 구성
    max_price = 0

    # 3. 탐색
    dfs_switch(0)

    print(f"#{tc} {max_price}")