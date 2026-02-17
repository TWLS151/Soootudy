# SWER-4834 숫자 카드


T = int(input())

for test_case in range(1, T + 1):
    N = int(input())
    cards = list(map(int, input().strip()))

    card_cnt = [0] * 10

    for i in range(N):
        card_cnt[cards[i]] += 1

    max_cnt = card_cnt[0]
    max_card = 0

    for j in range(10):
        if max_cnt <= card_cnt[j]:
            max_cnt = card_cnt[j]
            max_card = j

    print(f'#{test_case} {max_card} {max_cnt}')


    #===============================================
    # max 함수의 key 인자와 lambda 활용

    max_card = max(range(10), key=lambda x: (card_cnt[x], x))

    print(f'#{test_case} {max_card} {card_cnt[max_card]}')
