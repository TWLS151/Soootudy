import sys
sys.stdin = open('a.txt')

TC = int(input())
for test_case in range(1, TC+1):
    N, M, K = map(int, input().split())
		# 틀린 문제의 수를 구합니다.
    X = N - M
		# N 까지 카운팅이 K가 될 수 있는 후보 리스트를 만듭니다. 인덱스 0 은 필요 없기에 지웁니다.
    lst = list(range(0, N+1, K))[1:]
		# 틀린 문제의 수가 후보의 수보다 많으면 보너스 문제는 그냥 다 틀리면 됩니다.
    if N - M >= len(lst):
		    # 그래서 순수 카운팅만큼 점수가 나옵니다.
        score = M
    # 틀린 문제의 수가 더 적으면 최대한 앞에서 보너스 문제를 맞추는게 좋습니다.
    # 앞에서 맞힌 보너스 문제를 털고 최대한 뒤에서 보너스문제를 틀려야합니다.
    else:
		    # 그래서 뒤에서부터 틀린 보너스 문제의 인덱스를 지웁니다.
		    ## 이 부분을 슬라이싱으로 깔끔하게 할 수 있었습니다.
		    ### del lst[-X:]
        for _ in range(X):
            lst.pop()
				# 카운팅과 점수 계산을 시작합니다.
        count = 0
        score = 0
        # 1번 문제부터 맞힌 문제만큼만 셉니다.
        for i in range(1, M+1):
		        # 카운팅과 점수를 올리고
            count += 1
            score += 1
            # 만약 카운팅이 맞힌 보너스 문제 인덱스가 된다면 점수를 두배로 올립니다.
            if count in lst:
                score *= 2

    # 출력합니다.
    print(f'#{test_case} {score}')